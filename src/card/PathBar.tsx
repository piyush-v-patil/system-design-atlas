import { Link } from 'react-router-dom'
import type { TopicNode } from '../lib/types.ts'
import { topics } from '../lib/content.ts'
import { isDepth, nextOnPath, PATH, pathPosition } from '../lib/learningPath.ts'
import { useRead, useTimeline } from '../lib/progress.ts'

/** "Where am I and what's next" on every card, following the learning path. */
export function PathBar({ node }: { node: TopicNode }) {
  const read = useRead()
  const t = useTimeline()
  const pos = pathPosition(node.id)
  if (!pos) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs text-muted">
        <span>
          {['study-guide', 'index-of-system-design-topics', 'the-system-design-primer'].includes(node.id)
            ? 'The learning path is built from this part of the Primer.'
            : 'Background reading from the Primer, not a stop on the learning path.'}
        </span>
        <Link to="/path" className="font-medium text-link hover:underline">
          Open the learning path →
        </Link>
      </div>
    )
  }
  const { stage } = pos
  const done = stage.breadth.filter((id) => read.has(id) || id === node.id).length
  const next = nextOnPath(node.id)
  const depth = isDepth(pos.anchorId)
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between" data-path-stage={stage.id}>
      <div className="flex min-w-0 items-center gap-2">
        <Link to={`/path#stage-${stage.id}`} className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 font-semibold text-white hover:opacity-90">
          Stage {stage.index + 1}/{PATH.length}
        </Link>
        <span className="truncate">
          <span className="font-semibold text-ink">{stage.title}</span>
          <span className="text-muted">
            {' '}
            · {done}/{stage.breadth.length} core read
          </span>
        </span>
        {depth && (
          <span className="shrink-0 rounded-full border border-line px-1.5 text-[10px] text-muted" title="A detailed subsection">
            {t === 'short' ? 'depth · optional' : 'depth'}
          </span>
        )}
      </div>
      {next && (
        <Link to={`/topic/${next.id}`} className="shrink-0 font-medium text-link hover:underline">
          Next on the path: {next.title} →
        </Link>
      )}
      {!next && <span className="text-ok">End of the path. Nice work.</span>}
      <span className="sr-only">{topics.nodes[pos.anchorId].title}</span>
    </div>
  )
}
