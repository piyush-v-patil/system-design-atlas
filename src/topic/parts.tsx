import { Link } from 'react-router-dom'
import type { TopicNode } from '../lib/types.ts'
import { AREA_LABEL, areaColor, oods, solutionByReadmeTopic, topics } from '../lib/content.ts'

export function AreaChip({ node }: { node: TopicNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-muted">
      <span aria-hidden className="size-2 rounded-full" style={{ background: areaColor(node.area) }} />
      {AREA_LABEL[node.area]}
    </span>
  )
}

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

export function PracticeLinks({ node }: { node: TopicNode }) {
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

