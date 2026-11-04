import { Link } from 'react-router-dom'
import { GLOSSARY } from '../../content/glossary.ts'
import { getVisual } from '../../content/visuals/index.ts'
import { areaColor, topics } from '../lib/content.ts'
import { VIA_PATH } from '../lib/journey.ts'
import { PATH, PATH_ORDER, pathPosition } from '../lib/learningPath.ts'
import { useRead } from '../lib/progress.ts'
import type { TopicNode } from '../lib/types.ts'
import { resolveLink } from '../lib/links.ts'
import { plain } from '../lib/quote.ts'
import { primerNeighbours, useNextStep } from './journeyUi.tsx'

/** Card height shared by the Previous and Next cards and the stage ribbon, so the end row lines up. */
export const END_ROW_H = 'h-16'

/* ------------------------------------------------------------------ left rail: the stage you are in */

/** The current stage's topics: ✓ once read, ● for this page, ○ still to read. */
export function PathNavigator({ node }: { node: TopicNode }) {
  const read = useRead()
  const pos = pathPosition(node.id)
  if (!pos) {
    return (
      <nav aria-label="Learning path" className="flex flex-col gap-2 text-sm">
        <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">Background reading</div>
        <p className="text-muted">This page isn’t a stop on the learning path.</p>
        <Link to="/path" className="text-link hover:underline">
          See the learning path →
        </Link>
      </nav>
    )
  }
  const { stage } = pos
  const base = Math.min(...stage.breadth.map((id) => topics.nodes[id].level))
  // The stage's core topics, plus the current page if it is a detailed (depth) topic.
  const items = [...new Set([...stage.breadth, node.id])].filter((id) => PATH_ORDER.includes(id)).sort((a, b) => topics.nodes[a].order - topics.nodes[b].order)
  return (
    <nav aria-label="Learning path" className="flex flex-col gap-2 text-[13px]">
      <Link to={`/path#stage-${stage.id}`} className="text-[11px] font-semibold tracking-wide text-muted uppercase hover:text-ink">
        Stage {stage.index + 1} of {PATH.length}
      </Link>
      <div className="text-sm leading-snug font-semibold">{stage.title}</div>
      <ol className="mt-2 flex flex-col gap-0.5">
        {items.map((id) => {
          const n = topics.nodes[id]
          const here = id === node.id
          const isRead = read.has(id)
          const indent = Math.min(2, n.level - base)
          return (
            <li key={id}>
              <Link
                to={`/topic/${id}`}
                state={VIA_PATH}
                aria-current={here ? 'page' : undefined}
                className={`flex items-start gap-2 rounded-lg py-1.5 pr-2 leading-snug ${here ? 'bg-accent-soft font-semibold text-ink shadow-[inset_3px_0_0_var(--accent)]' : isRead ? 'text-muted hover:bg-surface-2 hover:text-ink' : 'text-ink hover:bg-surface-2'}`}
                style={{ paddingLeft: 8 + indent * 16 }}
              >
                <span aria-hidden className={`mt-px w-3 shrink-0 text-center ${here ? 'text-[var(--accent)]' : isRead ? 'text-ok' : 'text-[var(--node-stroke)]'}`}>
                  {here ? '●' : isRead ? '✓' : '○'}
                </span>
                <span>{n.title}</span>
                {isRead && !here && <span className="sr-only">(read)</span>}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ the cards fixed at the bottom of each rail */

/** The stop before this one on the path (or in reading order, for pages off the path). */
export function prevStep(id: string): TopicNode | undefined {
  const i = PATH_ORDER.indexOf(id)
  if (i > 0) return topics.nodes[PATH_ORDER[i - 1]]
  if (i === 0) return undefined
  return primerNeighbours(id).prev
}

const card = `${END_ROW_H} box-border flex w-full min-w-0 flex-col justify-center gap-0.5 rounded-xl px-4`

export function PrevCard({ node }: { node: TopicNode }) {
  const prev = prevStep(node.id)
  if (!prev) return <div className={END_ROW_H} aria-hidden />
  return (
    <Link to={`/topic/${prev.id}`} state={PATH_ORDER.includes(prev.id) ? VIA_PATH : undefined} className={`${card} border border-line bg-surface shadow-md shadow-black/15 hover:border-[var(--accent)]`}>
      <span className="text-[11px] text-muted">← Previous</span>
      <span className="truncate text-sm font-semibold">{prev.title}</span>
    </Link>
  )
}

export function NextCard({ node }: { node: TopicNode }) {
  const step = useNextStep(node.id)
  if (step.kind === 'end')
    return (
      <Link to="/problems" className={`${card} border border-ok/50 bg-ok-soft`}>
        <span className="text-[11px] font-semibold text-ok">End of the learning path</span>
        <span className="truncate text-sm font-semibold">Practise the problems →</span>
      </Link>
    )
  const t = step.target!
  const label = step.kind === 'back' ? 'Back to your path ↩' : step.kind === 'start' ? 'Follow the learning path →' : 'Next on your path →'
  return (
    <Link to={`/topic/${t.id}`} state={step.kind === 'back' ? undefined : VIA_PATH} className={`${card} bg-[var(--accent)] text-on-accent shadow-md shadow-black/20 hover:opacity-95`}>
      <span className="text-[11px] font-semibold opacity-90">{label}</span>
      <span className="truncate text-sm font-bold">{t.title}</span>
    </Link>
  )
}

/* ------------------------------------------------------------------ end of the page: the stage ribbon */

/** Where this topic sits in its stage: the stops done, this one, the next one, the rest. Marks the end of the page. */
export function StageRibbon({ node }: { node: TopicNode }) {
  const read = useRead()
  const step = useNextStep(node.id)
  const pos = pathPosition(node.id)
  if (!pos) {
    return (
      <section aria-label="End of page" className={`${END_ROW_H} box-border flex items-center justify-center gap-3 rounded-xl border border-line bg-surface px-5 text-sm text-muted`}>
        <span aria-hidden className="text-[var(--accent)]">◆</span>
        End of {node.title}
        <span aria-hidden className="text-[var(--accent)]">◆</span>
      </section>
    )
  }
  const { stage } = pos
  const stops = stage.breadth
  const here = pos.anchorId
  const next = step.kind === 'next' ? step.target?.id : undefined
  const left = stops.filter((id) => !read.has(id) && id !== here).length
    return (
    <section aria-label={`End of ${node.title}`} className={`${END_ROW_H} box-border flex flex-col justify-center gap-2 rounded-xl border border-line bg-surface px-4`}>
      <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight">
        <span className="min-w-0 truncate font-semibold">
          <span aria-hidden className="mr-1.5 text-ok">
            ✓
          </span>
          End of {node.title}
        </span>
        <span className="shrink-0 text-xs text-muted">
          Stage {stage.index + 1} · {left === 0 ? 'complete' : `${left} to go`}
          {next && (
            // On narrow screens the Next button right below says this already.
            <span className="hidden sm:inline">
              {' · next: '}
              <span className="text-link">{topics.nodes[next].title}</span>
            </span>
          )}
        </span>
      </div>
      <ol className="flex items-center" aria-label={`Stage ${stage.index + 1} stops`}>
        {stops.map((id, i) => {
          const isHere = id === here
          const isNext = id === next
          const isRead = read.has(id) || isHere
          const t = topics.nodes[id].title
          const segDone = isRead && (read.has(stops[i + 1]) || stops[i + 1] === here)
          return [
            <li key={id} className="flex shrink-0">
              <Link
                to={`/topic/${id}`}
                state={VIA_PATH}
                title={t}
                aria-label={`${t}${isHere ? ' (this page)' : isNext ? ' (next)' : isRead ? ' (read)' : ''}`}
                className={`grid place-items-center rounded-full transition-transform hover:scale-125 ${
                  isHere
                    ? 'size-4 bg-ok text-[9px] font-bold text-[#0b1020] ring-[3px] ring-ok-soft'
                    : isNext
                      ? 'size-3.5 border-[3px] border-[var(--accent)] bg-accent-soft'
                      : isRead
                        ? 'size-2.5 bg-ok'
                        : 'size-2.5 border-2 border-[var(--node-stroke)]'
                }`}
              >
                {isHere && <span aria-hidden>✓</span>}
              </Link>
            </li>,
            i < stops.length - 1 && (
              <li
                key={`${id}-seg`}
                aria-hidden
                className="h-0.5 min-w-1 flex-1"
                style={{
                  background: segDone ? 'var(--ok)' : isHere ? 'repeating-linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 9px)' : 'var(--border)',
                }}
              />
            ),
          ]
        })}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------------ right rail: a quiet panel of this page's extras */

const domainOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Markdown links, leaving out images. */
const mdLinks = (md: string) => [...md.matchAll(/(!?)\[([^\]]+)\]\(((?:[^()\s]|\([^)]*\))+)\)/g)].filter((m) => !m[1]).map((m) => ({ title: plain(m[2]), url: m[3] }))

/** What the side panel lists for a topic; also used to drop the duplicates from the main column on wide screens. */
export function sidePanelItems(node: TopicNode, hideSubtopics: boolean) {
  const sats = node.childIds.map((c) => topics.nodes[c]).filter((c) => c.kind !== 'topic')
  const md = [node.markdown, ...sats.map((s) => s.markdown)].join('\n')

  const terms = Object.entries(GLOSSARY)
    .map(([url, entry]) => ({ url, entry, at: md.indexOf(`](${url})`) }))
    .filter((t) => t.at >= 0)
    .sort((a, b) => a.at - b.at)

  const seenUrl = new Set<string>()
  const reading = sats
    .filter((s) => s.kind === 'sources' && linksOnly(s.markdown))
    .flatMap((s) => mdLinks(s.markdown))
    .filter((l) => !seenUrl.has(l.url) && seenUrl.add(l.url))
    .map((l) => ({ ...l, r: resolveLink(l.url, topics.source.path) }))

  const v = getVisual(node.id)
  const subs = node.childIds.map((c) => topics.nodes[c]).filter((c) => c.kind === 'topic')
  const covered = String(v?.props?.covers ?? '').split(/[|=,]/)
  const skip = new Set([node.id, ...(hideSubtopics ? subs.map((s) => s.id) : []), ...(v?.tiles?.map((t) => t.topicId) ?? []), ...covered])
  const linked = mdLinks(node.markdown)
    .map((l) => resolveLink(l.url, topics.source.path))
    .flatMap((r) => (r.kind === 'route' && r.to.startsWith('/topic/') ? [r.to.slice(7)] : []))
  const deeper = [...new Set([...(hideSubtopics ? [] : subs.map((s) => s.id)), ...(v?.related ?? []), ...linked])]
    .filter((id) => topics.nodes[id] && !skip.has(id))
    .slice(0, 12)
    .map((id) => topics.nodes[id])

  return { terms, reading, deeper }
}

const label = 'mb-1.5 text-[10.5px] font-semibold tracking-wider text-muted uppercase'

/**
 * The page's extras, kept out of the way of the reading: the terms it explains, further reading and where to go
 * deeper. Muted and small on purpose; terms open in place.
 */
export function SidePanel({ node, hideSubtopics }: { node: TopicNode; hideSubtopics: boolean }) {
  const { terms, reading, deeper } = sidePanelItems(node, hideSubtopics)
  if (!terms.length && !reading.length && !deeper.length) return null
  return (
    <div aria-label="On this page" className="flex flex-col gap-6 text-[13px] leading-snug text-muted">
      {terms.length > 0 && (
        <section>
          <h2 className={label}>Terms</h2>
          <ul className="flex flex-col">
            {terms.map(({ url, entry }) => (
              <li key={url}>
                <details className="group rounded-md">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 select-none hover:text-ink">
                    <svg aria-hidden className="size-3 shrink-0 opacity-60 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6 3l5 5-5 5z" />
                    </svg>
                    <span className="group-open:text-ink">{entry.term}</span>
                  </summary>
                  <div className="mb-2 ml-[18px] border-l border-line pl-2.5 text-[12.5px] leading-relaxed">
                    {entry.text[0]}{' '}
                    <a href={url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-link hover:underline">
                      More ↗
                    </a>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
      {deeper.length > 0 && (
        <section>
          <h2 className={label}>Go deeper</h2>
          <ul className="flex flex-col">
            {deeper.map((n) => (
              <li key={n.id}>
                <Link to={`/topic/${n.id}`} className="flex items-center gap-2 rounded-md py-1 hover:text-ink">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full opacity-80" style={{ background: areaColor(n.area) }} />
                  <span className="min-w-0 truncate">{n.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {reading.length > 0 && (
        <section>
          <h2 className={label}>Further reading</h2>
          <ul className="flex flex-col">
            {reading.map(({ title, url, r }) =>
              r.kind === 'route' ? (
                <li key={url}>
                  <Link to={r.to} className="block rounded-md py-1 hover:text-ink">
                    {title} →
                  </Link>
                </li>
              ) : (
                <li key={url}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="group block rounded-md py-1 hover:text-ink">
                    <span className="line-clamp-2">{title}</span>
                    <span className="text-[11px] opacity-70 group-hover:opacity-100">{domainOf(r.href)} ↗</span>
                  </a>
                </li>
              ),
            )}
          </ul>
        </section>
      )}
    </div>
  )
}

/** True when a section is nothing but a heading and a list of links, so the side panel can show it in full. */
export function linksOnly(md: string): boolean {
  return md
    .split('\n')
    .slice(1)
    .every((l) => !l.trim() || (/^\s*[*-]\s+/.test(l) && l.replace(/^\s*[*-]\s+/, '').replace(/!?\[[^\]]+\]\(((?:[^()\s]|\([^)]*\))+)\)/g, '').trim().length <= 3))
}
