import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import type { TopicVisual } from '../../content/visuals/types.ts'
import type { TopicNode } from '../lib/types.ts'
import { areaColor, topics } from '../lib/content.ts'
import { registry } from './registry.tsx'
import { ComparisonCard } from './kit/Comparison.tsx'
import { ClaimText, ProsCons, UseWhen } from './kit/Claims.tsx'

/** The visual layer of a topic: the visual itself, use-when, pros/cons and notes on the source. */
export function VisualSection({ visual, node, hideSummary }: { visual: TopicVisual; node: TopicNode; hideSummary?: boolean }) {
  const Comp = visual.component ? registry[visual.component] : undefined
  return (
    <section aria-label="Visual card" className="flex flex-col gap-4" data-visual={visual.component ?? visual.diagram}>
      {visual.summary && !hideSummary && (
        <p className="border-l-4 border-[var(--accent)] pl-3 text-[15px] leading-relaxed">
          <ClaimText claim={visual.summary} />
        </p>
      )}
      {Comp && (
        <Suspense fallback={<div className="h-40 rounded-xl border border-line bg-surface" aria-hidden />}>
          <Comp visual={visual} node={node} />
        </Suspense>
      )}
      {visual.tiles && visual.tiles.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visual.tiles.map((t, i) => {
            const n = topics.nodes[t.topicId]
            return (
              <li key={t.topicId} style={{ animation: `fade-up 300ms ease-out ${i * 50}ms both` }}>
                <Link to={`/topic/${t.topicId}`} className="group flex h-full gap-2.5 rounded-xl border border-line bg-surface p-3 hover:border-[var(--accent)]">
                  <span aria-hidden className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: areaColor(n.area) }} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold group-hover:text-link">{n.title} →</span>
                    <span className="block text-xs leading-snug text-muted">
                      <ClaimText claim={t.claim} />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {visual.points && !['key-points', 'envelope'].includes(visual.component ?? '') && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {visual.points.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-[var(--accent)]">
                ›
              </span>
              <ClaimText claim={c} />
            </li>
          ))}
        </ul>
      )}
      {visual.comparison && <ComparisonCard data={visual.comparison} activeKey={visual.props?.activeColumn as string | undefined} />}
      {visual.useWhen && <UseWhen claim={visual.useWhen} />}
      <ProsCons pros={visual.pros} cons={visual.cons} />
      {/* visual.notes are accuracy flags for maintainers (docs/PLAN.md); they are not shown to readers. */}
    </section>
  )
}
