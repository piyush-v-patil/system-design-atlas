import { Link } from 'react-router-dom'
import type { TopicNode } from '../lib/types.ts'
import { AREA_LABEL, areaColor, meta, oods, prevNext, solutionByReadmeTopic, topics } from '../lib/content.ts'
import { getVisual } from '../../content/visuals/index.ts'
import { OriginalPanel } from './OriginalPanel.tsx'

export function AreaChip({ node }: { node: TopicNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-muted">
      <span aria-hidden className="size-2 rounded-full" style={{ background: areaColor(node.area) }} />
      {AREA_LABEL[node.area]}
    </span>
  )
}

const KIND_LABEL = { disadvantages: 'Disadvantages', sources: 'Further reading' } as const

export function Breadcrumbs({ node }: { node: TopicNode }) {
  const ancestors = node.pathIds.slice(0, -1)
  if (ancestors.length === 0) return null
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
        {ancestors.map((id, i) => (
          <li key={id} className="flex items-center gap-1">
            <Link to={`/topic/${id}`} className="hover:text-ink hover:underline">
              {i === 0 ? 'Primer' : topics.nodes[id].title}
            </Link>
            <span aria-hidden>›</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function ChildLinks({ node }: { node: TopicNode }) {
  if (node.childIds.length === 0) return null
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">In this section</h3>
      <ul className="flex flex-wrap gap-1.5">
        {node.childIds.map((id) => {
          const c = topics.nodes[id]
          return (
            <li key={id}>
              <Link
                to={`/topic/${id}`}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-sm hover:border-[var(--accent)] hover:bg-surface-2 ${c.kind !== 'topic' ? 'text-muted' : ''}`}
              >
                <span aria-hidden className={`rounded-full ${c.kind === 'topic' ? 'size-2' : 'size-1.5 opacity-70'}`} style={{ background: areaColor(c.area) }} />
                {c.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PracticeLinks({ node }: { node: TopicNode }) {
  const sol = solutionByReadmeTopic.get(node.id)
  if (sol)
    return (
      <Link to={`/solutions/${sol.id}`} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
        Open the solution walkthrough →
      </Link>
    )
  if (node.id === 'object-oriented-design-interview-questions-with-solutions')
    return (
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {oods.map((o) => (
          <li key={o.id}>
            <Link to={`/ood/${o.id}`} className="block rounded-lg border border-line px-3 py-2 text-sm hover:border-[var(--accent)] hover:bg-surface-2">
              {o.readmeTitle} →
            </Link>
          </li>
        ))}
      </ul>
    )
  return null
}

export function TopicCard({ node, onClose }: { node: TopicNode; onClose?: () => void }) {
  const { prev, next } = prevNext(node.id)
  const visual = getVisual(node.id)
  return (
    <article className="flex flex-col gap-5" aria-labelledby="card-title" data-topic-id={node.id}>
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <Breadcrumbs node={node} />
          {onClose && (
            <button onClick={onClose} className="-mt-1 -mr-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close card">
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
        <h2 id="card-title" className="text-2xl font-semibold tracking-tight text-balance">
          {node.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <AreaChip node={node} />
          {node.kind !== 'topic' && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{KIND_LABEL[node.kind]}</span>
          )}
        </div>
      </header>

      <PracticeLinks node={node} />
      <ChildLinks node={node} />
      <OriginalPanel key={node.id} doc={topics} nodeId={node.id} defaultOpen={!visual} />

      <nav aria-label="Previous and next topic" className="grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
        {prev ? (
          <Link to={`/topic/${prev.id}`} className="rounded-lg p-2 hover:bg-surface-2">
            <span className="block text-xs text-muted">← Previous</span>
            <span className="line-clamp-2">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/topic/${next.id}`} className="rounded-lg p-2 text-right hover:bg-surface-2">
            <span className="block text-xs text-muted">Next →</span>
            <span className="line-clamp-2">{next.title}</span>
          </Link>
        )}
      </nav>
      <p className="text-[11px] leading-snug text-muted">
        Original text from{' '}
        <a className="text-link hover:underline" href={meta.repo} target="_blank" rel="noopener noreferrer">
          The System Design Primer
        </a>{' '}
        by Donne Martin and contributors,{' '}
        <a className="text-link hover:underline" href={meta.license.url} target="_blank" rel="noopener noreferrer">
          {meta.license.name}
        </a>
        .
      </p>
    </article>
  )
}
