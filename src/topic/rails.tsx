import { useEffect, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { GLOSSARY } from '../../content/glossary.ts'
import { getVisual } from '../../content/visuals/index.ts'
import { areaColor, topics } from '../lib/content.ts'
import { VIA_PATH } from '../lib/journey.ts'
import { PATH, PATH_ORDER, pathPosition } from '../lib/learningPath.ts'
import { useRead } from '../lib/progress.ts'
import type { TopicNode } from '../lib/types.ts'
import { paragraphs } from '../visuals/auto.ts'
import { primerNeighbours, useNextStep } from './journeyUi.tsx'

/** Card height shared by the Previous and Next cards and the stage ribbon, so the end row lines up. */
export const END_ROW_H = 'h-[104px]'

/* ------------------------------------------------------------------ left rail: the stage you are in */

/** The current stage's topics, ticked as you read them; the current one highlighted. */
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
  const done = stage.breadth.filter((id) => read.has(id)).length
  return (
    <nav aria-label="Learning path" className="flex flex-col gap-2 text-[13px]">
      <Link to={`/path#stage-${stage.id}`} className="text-[11px] font-semibold tracking-wide text-muted uppercase hover:text-ink">
        Stage {stage.index + 1} of {PATH.length}
      </Link>
      <div className="text-sm leading-snug font-semibold">{stage.title}</div>
      <div className="h-1.5 rounded-full bg-line" aria-hidden>
        <div className="h-1.5 rounded-full bg-ok transition-all" style={{ width: `${(done / stage.breadth.length) * 100}%` }} />
      </div>
      <div className="text-xs text-muted">
        {done} of {stage.breadth.length} core topics read
      </div>
      <ol className="mt-1 flex flex-col gap-0.5">
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
                className={`flex items-start gap-2 rounded-lg py-1.5 pr-2 leading-snug ${here ? 'bg-accent-soft font-semibold text-ink shadow-[inset_3px_0_0_var(--accent)]' : isRead ? 'text-muted hover:bg-surface-2' : 'hover:bg-surface-2'}`}
                style={{ paddingLeft: 8 + indent * 14 }}
              >
                <span aria-hidden className={`mt-px w-3 shrink-0 text-center ${here ? 'text-[var(--accent)]' : isRead ? 'text-ok' : 'text-line'}`}>
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

const card = `${END_ROW_H} box-border flex w-full flex-col justify-center gap-1 rounded-2xl px-4`

export function PrevCard({ node }: { node: TopicNode }) {
  const prev = prevStep(node.id)
  if (!prev) return <div className={END_ROW_H} aria-hidden />
  return (
    <Link to={`/topic/${prev.id}`} state={PATH_ORDER.includes(prev.id) ? VIA_PATH : undefined} className={`${card} border border-line bg-surface shadow-lg shadow-black/20 hover:border-[var(--accent)]`}>
      <span className="text-xs text-muted">← Previous</span>
      <span className="line-clamp-2 text-[15px] leading-snug font-semibold">{prev.title}</span>
    </Link>
  )
}

export function NextCard({ node }: { node: TopicNode }) {
  const step = useNextStep(node.id)
  if (step.kind === 'end')
    return (
      <Link to="/problems" className={`${card} border border-ok/50 bg-ok-soft`}>
        <span className="text-xs font-semibold text-ok">End of the learning path</span>
        <span className="text-[15px] leading-snug font-semibold">Practise the problems →</span>
      </Link>
    )
  const t = step.target!
  const label = step.kind === 'back' ? 'Back to your path ↩' : step.kind === 'start' ? 'Follow the learning path →' : 'Next on your path →'
  return (
    <Link to={`/topic/${t.id}`} state={step.kind === 'back' ? undefined : VIA_PATH} className={`${card} bg-[var(--accent)] text-on-accent shadow-lg shadow-black/25 hover:opacity-95`}>
      <span className="text-xs font-semibold">{label}</span>
      <span className="line-clamp-2 text-[15px] leading-snug font-bold">{t.title}</span>
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
      <section aria-label="End of page" className={`${END_ROW_H} box-border flex items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-5 text-sm text-muted`}>
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
  const last = topics.nodes[stops[stops.length - 1]]
  return (
    <section aria-label={`End of ${node.title}`} className={`${END_ROW_H} box-border flex flex-col justify-center gap-2.5 rounded-2xl border border-line bg-surface px-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold">
          <span aria-hidden className="mr-1.5 text-ok">
            ✓
          </span>
          End of {node.title}
        </span>
        <span className="text-xs text-muted">
          Stage {stage.index + 1} · {left === 0 ? 'stage complete' : `${left} to go`}
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
                    ? 'size-5 bg-ok text-[10px] font-bold text-[#0b1020] ring-4 ring-ok-soft'
                    : isNext
                      ? 'size-4 border-[3px] border-[var(--accent)] bg-accent-soft'
                      : isRead
                        ? 'size-3 bg-ok'
                        : 'size-3 border-2 border-[var(--node-stroke)]'
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
      <div className="flex justify-between gap-3 text-xs text-muted">
        <span className="truncate">{topics.nodes[stops[0]].title}</span>
        {next && (
          <span className="shrink-0">
            next: <span className="text-link">{topics.nodes[next].title}</span>
          </span>
        )}
        <span className="truncate text-right">{last.title}</span>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ right rail: margin notes beside the text */

interface Note {
  key: string
  kind: 'term' | 'topic'
  title: string
  text: string
  to?: string
  color?: string
  top: number
}

const summaryOf = (id: string) => {
  const t = getVisual(id)?.summary?.text ?? paragraphs(topics.nodes[id])[0]?.text ?? ''
  return t.length > 170 ? t.slice(0, 167).replace(/\s+\S*$/, '') + '…' : t
}

/**
 * Notes for the links in the text, placed beside the paragraph that holds them: a short explanation for a linked
 * concept, and a one-line summary for a link to another topic. Measured after layout and kept from overlapping.
 */
export function MarginNotes({ article, rail, node }: { article: RefObject<HTMLElement | null>; rail: RefObject<HTMLElement | null>; node: TopicNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  // After mount (not layout): the rail's ref is attached after this component's own layout effects run.
  useEffect(() => {
    const a = article.current
    const r = rail.current
    if (!a || !r) return
    const measure = () => {
      const base = r.getBoundingClientRect().top
      const limit = r.getBoundingClientRect().height - 150 // keep clear of the Next card
      const seen = new Set<string>()
      const out: Note[] = []
      let floor = 0
      for (const el of a.querySelectorAll<HTMLAnchorElement>('.primer a')) {
        const href = el.getAttribute('href') ?? ''
        let note: Omit<Note, 'top'> | null = null
        if (el.classList.contains('glossary-term')) {
          const entry = GLOSSARY[el.dataset.glossary ?? '']
          if (entry) note = { key: `g:${entry.term}`, kind: 'term', title: entry.term, text: entry.text[0] }
        } else {
          const m = /^#\/topic\/([^?#]+)/.exec(href)
          const id = m?.[1]
          if (id && id !== node.id && topics.nodes[id] && !node.childIds.includes(id)) {
            const n = topics.nodes[id]
            note = { key: `t:${id}`, kind: 'topic', title: n.title, text: summaryOf(id), to: `/topic/${id}`, color: areaColor(n.area) }
          }
        }
        if (!note || seen.has(note.key)) continue
        seen.add(note.key)
        const want = el.getBoundingClientRect().top - base - 4
        const top = Math.max(want, floor)
        if (top > limit) break
        out.push({ ...note, top })
        floor = top + estimateHeight(note) + 16
        if (out.length >= 14) break
      }
      setNotes((prev) => (JSON.stringify(prev) === JSON.stringify(out) ? prev : out))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(a)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [article, rail, node])

  return (
    <div aria-label="Notes beside the text" className="absolute inset-x-0 top-0">
      {notes.map((n) => (
        <aside
          key={n.key}
          className="absolute inset-x-0 border-l-2 pl-3.5 text-[13px] leading-relaxed"
          style={{ top: n.top, borderColor: n.kind === 'term' ? 'var(--accent)' : n.color, animation: 'fade-in 240ms ease-out both' }}
        >
          <div className="text-[10.5px] font-semibold tracking-wide uppercase" style={{ color: n.kind === 'term' ? 'var(--accent)' : n.color }}>
            {n.kind === 'term' ? 'Term' : 'Related topic'}
          </div>
          {n.to ? (
            <Link to={n.to} className="mt-0.5 block font-semibold text-ink hover:text-link">
              {n.title} →
            </Link>
          ) : (
            <div className="mt-0.5 font-semibold">{n.title}</div>
          )}
          <p className="mt-1 text-muted">{n.text}</p>
        </aside>
      ))}
    </div>
  )
}

/** Rough height of a note (title + wrapped text at ~38 characters a line), for spacing before it is laid out. */
function estimateHeight(n: Omit<Note, 'top'>): number {
  return 44 + Math.ceil(n.text.length / 36) * 21
}
