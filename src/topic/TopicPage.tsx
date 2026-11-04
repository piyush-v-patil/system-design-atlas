import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getVisual } from '../../content/visuals/index.ts'
import { AreaChip, Breadcrumbs, PracticeLinks } from './parts.tsx'
import { SectionBody } from '../card/OriginalPanel.tsx'
import { areaColor, getTopic, githubBlob, topics } from '../lib/content.ts'
import { visitTopic } from '../lib/journey.ts'
import type { TopicNode } from '../lib/types.ts'
import { FocusMap } from '../map/FocusMap.tsx'
import { VisualSection } from '../visuals/VisualSection.tsx'
import { registry } from '../visuals/registry.tsx'
import { StepHighlightProvider, useOriginalHighlight } from '../visuals/kit/highlight.tsx'
import { NextNav, PathStrip } from './journeyUi.tsx'

export type Layout = 'visual' | 'map' | 'text'
const LAYOUTS: { value: Layout; label: string; hint: string }[] = [
  { value: 'visual', label: 'Visual + text', hint: 'The animation or diagram beside the Primer’s text' },
  { value: 'map', label: 'Map + text', hint: 'A map of this part of the Primer beside the text' },
  { value: 'text', label: 'Text only', hint: 'Just the Primer’s text' },
]
const LAYOUT_KEY = 'atlas-layout'

function readLayout(): Layout {
  try {
    const v = localStorage.getItem(LAYOUT_KEY)
    return v === 'map' || v === 'text' ? v : 'visual'
  } catch {
    return 'visual'
  }
}

/** Short sections the Primer attaches to a topic ("Source(s)…", "Disadvantage(s)…"), read on the topic's page. */
const satellites = (n: TopicNode) => n.childIds.map((c) => topics.nodes[c]).filter((c) => c.kind !== 'topic')
const subtopics = (n: TopicNode) => n.childIds.map((c) => topics.nodes[c]).filter((c) => c.kind === 'topic')
const isBlank = (s: string) => !s.trim()

function LayoutToggle({ value, onChange }: { value: Layout; onChange: (l: Layout) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-xs" role="radiogroup" aria-label="Page layout">
      {LAYOUTS.map((l) => (
        <button
          key={l.value}
          role="radio"
          aria-checked={value === l.value}
          title={l.hint}
          onClick={() => onChange(l.value)}
          className={`rounded-md px-2.5 py-1 font-medium ${value === l.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
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

/** The Primer's own words for this topic, always open, with its short attached sections underneath. */
function PrimerText({ node, focusId }: { node: TopicNode; focusId?: string }) {
  const ref = useRef<HTMLElement>(null)
  useOriginalHighlight(ref, [node.id])
  const sats = satellites(node)
  const subs = subtopics(node)
  const own = !isBlank(node.markdown)
  const last = sats.length ? sats[sats.length - 1] : node
  const lines: [number, number] = [node.sourceLines[0], last.sourceLines[1]]
  return (
    <section className="rounded-xl border border-line bg-surface" aria-label="The Primer's text">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
        <h2 className="text-sm font-semibold">From The System Design Primer</h2>
        <a className="text-xs text-muted underline-offset-2 hover:underline" href={githubBlob(topics.source.path, lines)} target="_blank" rel="noopener noreferrer">
          README.md · lines {lines[0]}–{lines[1]} ↗
        </a>
      </div>
      <article ref={ref} className="primer prose prose-sm max-w-none px-4 pt-1 pb-4 md:prose-base">
        {own ? (
          <SectionBody doc={topics} node={node} baseLevel={node.level} showHeading={false} />
        ) : (
          <p className="text-sm text-muted italic">This heading has no text of its own in the Primer; its content is in the subtopics below.</p>
        )}
        {sats.map((s) => (
          <div key={s.id} id={`sec-${s.id}`} data-topic-id={s.id} className={`scroll-mt-4 rounded-lg ${focusId === s.id ? 'bg-accent-soft/40 px-3 py-1 ring-1 ring-[var(--accent)]/50' : ''}`}>
            <SectionBody doc={topics} node={s} baseLevel={node.level} showHeading />
          </div>
        ))}
      </article>
      {!own && subs.length > 0 && (
        <div className="border-t border-line px-4 py-3">
          <SubtopicList items={subs} title="Subtopics" />
        </div>
      )}
    </section>
  )
}

/** Subtopics and related topics, folded away so they don't compete with the reading. */
function GoDeeper({ node, hideSubtopics }: { node: TopicNode; hideSubtopics: boolean }) {
  const subs = hideSubtopics ? [] : subtopics(node)
  const v = getVisual(node.id)
  // Leave out anything the page already links to: subtopics, tiles, and the topics a study resource points to.
  const covered = String(v?.props?.covers ?? '').split(/[|=,]/)
  const shown = new Set([node.id, ...subtopics(node).map((s) => s.id), ...(v?.tiles?.map((t) => t.topicId) ?? []), ...covered])
  const related = (v?.related ?? []).filter((id) => topics.nodes[id] && !shown.has(id)).map((id) => topics.nodes[id])
  if (!subs.length && !related.length) return null
  const count = subs.length + related.length
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
        <span className="sr-only">({count} links)</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-line px-4 py-3">
        {subs.length > 0 && <SubtopicList items={subs} title="Subtopics in this section" />}
        {related.length > 0 && <SubtopicList items={related} title="Related topics" />}
      </div>
    </details>
  )
}

/** Visuals for the attached "Disadvantage(s)" sections, under the topic's own visual. */
function SatelliteVisuals({ node }: { node: TopicNode }) {
  return (
    <>
      {satellites(node)
        .filter((s) => s.kind === 'disadvantages')
        .map((s) => {
          const v = getVisual(s.id)
          const Comp = v?.component ? registry[v.component] : undefined
          return Comp && v ? (
            <section key={s.id} aria-label={s.title} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <Comp visual={v} node={s} />
            </section>
          ) : null
        })}
    </>
  )
}

/**
 * A topic, for reading: the visual (or a map) on the left, the Primer's text on the right, one clear next step at the
 * end. Short attached sections (sources, disadvantages) are part of their topic's page.
 */
export function TopicPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const requested = getTopic(id)
  const [layout, setLayoutState] = useState<Layout>(readLayout)
  const setLayout = (l: Layout) => {
    setLayoutState(l)
    try {
      localStorage.setItem(LAYOUT_KEY, l)
    } catch {
      /* storage unavailable */
    }
  }
  const node = requested && requested.kind !== 'topic' && requested.parentId ? topics.nodes[requested.parentId] : requested
  const focusId = requested && node && requested.id !== node.id ? requested.id : undefined
  const viaPath = (location.state as { viaPath?: boolean } | null)?.viaPath === true

  useEffect(() => {
    if (node) visitTopic(node.id, viaPath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id, location.key])
  useEffect(() => {
    if (focusId) document.getElementById(`sec-${focusId}`)?.scrollIntoView({ block: 'start' })
  }, [focusId])

  if (!node) return <p className="p-6">No topic with id “{id}”.</p>
  const visual = getVisual(node.id)
  const tilesCoverSubtopics = !!visual?.tiles?.length
  const hubWithoutText = isBlank(node.markdown)

  const left =
    layout === 'map' ? (
      <div className="h-[60vh] min-h-[380px] overflow-hidden rounded-xl border border-line bg-surface lg:h-[calc(100vh-7rem)]">
        {/* A topic with subtopics is mapped around itself; a single topic is shown among its neighbours. */}
        <FocusMap selectedId={subtopics(node).length || !node.parentId ? node.id : node.parentId} markId={node.id} onSelect={(nid) => navigate(`/topic/${nid}`)} />
      </div>
    ) : (
      <div className="flex flex-col gap-5">
        {visual && <VisualSection key={`visual-${node.id}`} visual={visual} node={node} hideSummary />}
        <SatelliteVisuals node={node} />
      </div>
    )

  return (
    <StepHighlightProvider>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-5 md:px-8" data-topic-id={node.id}>
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumbs node={node} />
            <div className="flex items-center gap-2">
              <Link to={`/map/${node.id}`} className="text-xs text-muted hover:text-ink hover:underline">
                Show on the map
              </Link>
              <LayoutToggle value={layout} onChange={setLayout} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{node.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <AreaChip node={node} />
          </div>
        </header>
        <PathStrip node={node} />
        <PracticeLinks node={node} />

        {layout === 'text' ? (
          <div className="mx-auto w-full max-w-3xl">
            <PrimerText node={node} focusId={focusId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">{left}</div>
            <div className="min-w-0">
              <PrimerText node={node} focusId={focusId} />
            </div>
          </div>
        )}

        <GoDeeper node={node} hideSubtopics={tilesCoverSubtopics || hubWithoutText} />
        <NextNav node={node} />
      </div>
    </StepHighlightProvider>
  )
}
