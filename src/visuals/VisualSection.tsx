import { Link } from 'react-router-dom'
import type { TopicVisual } from '../../content/visuals/types.ts'
import type { TopicNode } from '../lib/types.ts'
import { areaColor, topics } from '../lib/content.ts'
import { registry } from './registry.tsx'
import { ComparisonCard } from './kit/Comparison.tsx'
import { ClaimText, ProsCons, UseWhen } from './kit/Claims.tsx'

/** Everything above the Original layer: the visual, use-when, pros/cons, notes and related topics. */
export function VisualSection({ visual, node }: { visual: TopicVisual; node: TopicNode }) {
  const Comp = visual.component ? registry[visual.component] : undefined
  return (
    <section aria-label="Visual card" className="flex flex-col gap-4" data-visual={visual.component ?? visual.diagram}>
      {visual.summary && (
        <p className="border-l-4 border-[var(--accent)] pl-3 text-[15px] leading-relaxed">
          <ClaimText claim={visual.summary} />
        </p>
      )}
      {Comp && <Comp visual={visual} node={node} />}
      {visual.comparison && <ComparisonCard data={visual.comparison} activeKey={visual.props?.activeColumn as string | undefined} />}
      {visual.useWhen && <UseWhen claim={visual.useWhen} />}
      <ProsCons pros={visual.pros} cons={visual.cons} />
      {visual.notes?.map((n, i) => (
        <p key={i} className="rounded-lg border border-[var(--warn)]/50 bg-[var(--warn-soft)] px-3 py-2 text-xs leading-relaxed">
          <strong className="text-warn">Note on the source: </strong>
          {n}
        </p>
      ))}
      {visual.related && visual.related.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Related</h3>
          <ul className="flex flex-wrap gap-1.5">
            {visual.related.map((id) => {
              const r = topics.nodes[id]
              if (!r) return null
              return (
                <li key={id}>
                  <Link to={`/topic/${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs hover:border-[var(--accent)] hover:bg-surface-2">
                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: areaColor(r.area) }} />
                    {r.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
