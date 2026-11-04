import { useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getVisual } from '../../content/visuals/index.ts'
import { AreaChip, Breadcrumbs, PracticeLinks } from './parts.tsx'
import { PrimerMarkdown } from '../card/PrimerMarkdown.tsx'
import { areaColor, getTopic, topics } from '../lib/content.ts'
import { visitTopic } from '../lib/journey.ts'
import type { TopicNode } from '../lib/types.ts'
import { VisualSection } from '../visuals/VisualSection.tsx'
import { StepHighlightProvider, useOriginalHighlight } from '../visuals/kit/highlight.tsx'
import { NextNav, PathStrip } from './journeyUi.tsx'

/** Short sections attached to a topic ("Source(s)…", "Disadvantage(s)…"), read as part of the topic's page. */
const satellites = (n: TopicNode) => n.childIds.map((c) => topics.nodes[c]).filter((c) => c.kind !== 'topic')
const subtopics = (n: TopicNode) => n.childIds.map((c) => topics.nodes[c]).filter((c) => c.kind === 'topic')
const isBlank = (s: string) => !s.trim()

/**
 * Split a section's markdown after its first prose paragraph, so the visual can sit right after the introduction.
 * The two parts concatenate back to the original text exactly.
 */
export function splitLead(md: string): [string, string] {
  const parts = md.split(/(\n[ \t]*\n)/)
  for (let i = 0; i < parts.length; i += 2) {
    const block = parts[i].trim()
    if (!block) continue
    const prose = !/^(<|!\[|>|[*+-]\s|\d+\.\s|\||```|#)/.test(block) && !/^\s{4}/.test(parts[i])
    if (prose) {
      const lead = parts.slice(0, i + 1).join('')
      return [lead, md.slice(lead.length)]
    }
  }
  return [md, '']
}

function SubtopicList({ items, title }: { items: TopicNode[]; title: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link to={`/topic/${c.id}`} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:border-[var(--accent)] hover:bg-surface-2">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: areaColor(c.area) }} />
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Subtopics and related topics, folded away so they don't compete with the reading. */
function GoDeeper({ node, hideSubtopics }: { node: TopicNode; hideSubtopics: boolean }) {
  const v = getVisual(node.id)
  const subs = hideSubtopics ? [] : subtopics(node)
  // Leave out anything the page already links to: subtopics, tiles, and the topics a study resource points to.
  const covered = String(v?.props?.covers ?? '').split(/[|=,]/)
  const shown = new Set([node.id, ...subtopics(node).map((s) => s.id), ...(v?.tiles?.map((t) => t.topicId) ?? []), ...covered])
  const related = (v?.related ?? []).filter((id) => topics.nodes[id] && !shown.has(id)).map((id) => topics.nodes[id])
  if (!subs.length && !related.length) return null
  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold select-none hover:bg-surface-2">
        <svg aria-hidden className="size-4 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 3l5 5-5 5z" />
        </svg>
        Go deeper
        <span className="font-normal text-muted">
          · {subs.length > 0 && `${subs.length} subtopic${subs.length === 1 ? '' : 's'}`}
          {subs.length > 0 && related.length > 0 && ', '}
          {related.length > 0 && `${related.length} related`}
        </span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-line px-4 py-3">
        {subs.length > 0 && <SubtopicList items={subs} title="Subtopics in this section" />}
        {related.length > 0 && <SubtopicList items={related} title="Related topics" />}
      </div>
    </details>
  )
}

/**
 * A topic, for reading, in one column: the introduction, the visual, the rest of the text, then the short attached
 * sections (further reading, disadvantages) and one clear next step.
 */
export function TopicPage() {
  const { id } = useParams()
  const location = useLocation()
  const requested = getTopic(id)
  const node = requested && requested.kind !== 'topic' && requested.parentId ? topics.nodes[requested.parentId] : requested
  const focusId = requested && node && requested.id !== node.id ? requested.id : undefined
  const viaPath = (location.state as { viaPath?: boolean } | null)?.viaPath === true
  const ref = useRef<HTMLElement>(null)
  useOriginalHighlight(ref, [node?.id])

  useEffect(() => {
    if (node) visitTopic(node.id, viaPath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id, location.key])
  useEffect(() => {
    if (focusId) document.getElementById(`sec-${focusId}`)?.scrollIntoView({ block: 'start' })
  }, [focusId])

  if (!node) return <p className="p-6">No topic with id “{id}”.</p>
  const visual = getVisual(node.id)
  const subs = subtopics(node)
  const isRoot = node.id === topics.rootId
  const hubWithoutText = isBlank(node.markdown) && !isRoot
  const [lead, rest] = splitLead(node.markdown)
  const hasVisual = !!visual && !visual.textOnly
  const prose = 'primer prose prose-sm max-w-none md:prose-base'

  return (
    <StepHighlightProvider>
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 px-4 py-6 md:px-6" data-topic-id={node.id}>
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumbs node={node} />
            <Link to={`/map/${node.id}`} className="text-xs text-muted hover:text-ink hover:underline">
              Show on the map
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{node.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <AreaChip node={node} />
          </div>
        </header>
        <PathStrip node={node} />
        <PracticeLinks node={node} />

        <article ref={ref} className="flex flex-col gap-6" aria-label={node.title}>
          {/* With a visual, it sits after the introduction; without one, the text reads straight through. */}
          {(isRoot && !isBlank(topics.preamble)) || !isBlank(lead) ? (
            <div className={prose}>
              {isRoot && <PrimerMarkdown markdown={topics.preamble} docPath={topics.source.path} />}
              <PrimerMarkdown markdown={hasVisual ? lead : node.markdown} docPath={topics.source.path} />
            </div>
          ) : null}
          {hasVisual && <VisualSection key={`visual-${node.id}`} visual={visual!} node={node} hideSummary />}
          {hasVisual && !isBlank(rest) && (
            <div className={prose}>
              <PrimerMarkdown markdown={rest} docPath={topics.source.path} />
            </div>
          )}
          {satellites(node).map((s) => (
            <section
              key={s.id}
              id={`sec-${s.id}`}
              data-topic-id={s.id}
              className={`scroll-mt-4 rounded-xl border border-line bg-surface px-4 py-1 ${focusId === s.id ? 'ring-2 ring-[var(--accent)]/60' : ''}`}
            >
              <div className={prose}>
                <h3>{s.title}</h3>
                <PrimerMarkdown markdown={s.markdown} docPath={topics.source.path} />
              </div>
            </section>
          ))}
          {hubWithoutText && subs.length > 0 && <SubtopicList items={subs} title="In this section" />}
        </article>

        <GoDeeper node={node} hideSubtopics={!!visual?.tiles?.length || hubWithoutText} />
        <NextNav node={node} />
      </div>
    </StepHighlightProvider>
  )
}
