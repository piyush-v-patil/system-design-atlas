import { Link } from 'react-router-dom'
import { topics } from '../lib/content.ts'
import { isDetour, VIA_PATH } from '../lib/journey.ts'
import { nextOnPath, PATH, PATH_ORDER, pathPosition } from '../lib/learningPath.ts'
import { usePathCursor, useRead } from '../lib/progress.ts'
import type { TopicNode } from '../lib/types.ts'

/** Topics in the Primer's order, without the short sections that are shown on their parent's page. */
const READING_ORDER = topics.order.filter((id) => topics.nodes[id].kind === 'topic')

export function primerNeighbours(id: string): { prev?: TopicNode; next?: TopicNode } {
  const i = READING_ORDER.indexOf(id)
  return { prev: i > 0 ? topics.nodes[READING_ORDER[i - 1]] : undefined, next: i >= 0 ? topics.nodes[READING_ORDER[i + 1]] : undefined }
}

/** What "next" means on this page: one answer, used at the top and at the bottom. */
export function useNextStep(id: string): { kind: 'next' | 'back' | 'start' | 'end'; target?: TopicNode; alt?: TopicNode } {
  const cursor = usePathCursor()
  const onPath = PATH_ORDER.includes(id)
  if (isDetour(id, cursor)) return { kind: 'back', target: topics.nodes[cursor!], alt: onPath ? nextOnPath(id) : undefined }
  if (!onPath) return { kind: 'start', target: topics.nodes[cursor ? (nextOnPath(cursor)?.id ?? cursor) : PATH_ORDER[0]] }
  const next = nextOnPath(id)
  return next ? { kind: 'next', target: next } : { kind: 'end' }
}

/** Compact "where am I on the learning path" strip, with the way back after a detour. */
export function PathStrip({ node }: { node: TopicNode }) {
  const read = useRead()
  const step = useNextStep(node.id)
  const pos = pathPosition(node.id)
  const onPath = PATH_ORDER.includes(node.id)
  if (step.kind === 'back')
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-[var(--accent)]/50 bg-accent-soft/40 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong>You’re on a detour.</strong> <span className="text-muted">Your place on the learning path is</span> {step.target!.title}.
        </span>
        <Link to={`/topic/${step.target!.id}`} className="shrink-0 font-medium text-link hover:underline">
          Back to your path →
        </Link>
      </div>
    )
  if (!onPath || !pos)
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted">This page is background reading, not a stop on the learning path.</span>
        <Link to="/path" className="shrink-0 font-medium text-link hover:underline">
          See the learning path →
        </Link>
      </div>
    )
  const { stage } = pos
  const done = stage.breadth.filter((id) => read.has(id) || id === node.id).length
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-sm sm:flex-row sm:items-center">
      <Link to={`/path#stage-${stage.id}`} className="shrink-0 self-start rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-white hover:opacity-90 sm:self-auto">
        Stage {stage.index + 1} of {PATH.length}
      </Link>
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{stage.title}</span>
        <span className="mt-1 block h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-line" aria-hidden>
          <span className="block h-full rounded-full bg-ok" style={{ width: `${(done / stage.breadth.length) * 100}%` }} />
        </span>
        <span className="sr-only">
          {done} of {stage.breadth.length} core topics read
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted">
        {done}/{stage.breadth.length} core topics read
      </span>
    </div>
  )
}

/** The end of every page: one clear next step, then the Primer's own order as a quieter option. */
export function NextNav({ node }: { node: TopicNode }) {
  const step = useNextStep(node.id)
  const { prev, next } = primerNeighbours(node.id)
  const big = 'flex items-center justify-between gap-3 rounded-xl bg-[var(--accent)] px-4 py-3 text-white hover:opacity-90'
  return (
    <nav aria-label="What to read next" className="flex flex-col gap-3 border-t border-line pt-5">
      {step.kind === 'next' && (
        <Link to={`/topic/${step.target!.id}`} state={VIA_PATH} className={big}>
          <span>
            <span className="block text-xs opacity-85">Next on your learning path</span>
            <span className="block font-semibold">{step.target!.title}</span>
          </span>
          <span aria-hidden className="text-xl">→</span>
        </Link>
      )}
      {step.kind === 'back' && (
        <>
          <Link to={`/topic/${step.target!.id}`} className={big}>
            <span>
              <span className="block text-xs opacity-85">Back to your place on the learning path</span>
              <span className="block font-semibold">{step.target!.title}</span>
            </span>
            <span aria-hidden className="text-xl">↩</span>
          </Link>
          {step.alt && (
            <p className="text-sm text-muted">
              Or continue the path from this page instead:{' '}
              <Link to={`/topic/${step.alt.id}`} state={VIA_PATH} className="font-medium text-link hover:underline">
                {step.alt.title} →
              </Link>
            </p>
          )}
        </>
      )}
      {step.kind === 'start' && (
        <Link to={`/topic/${step.target!.id}`} state={VIA_PATH} className={big}>
          <span>
            <span className="block text-xs opacity-85">Follow the learning path</span>
            <span className="block font-semibold">{step.target!.title}</span>
          </span>
          <span aria-hidden className="text-xl">→</span>
        </Link>
      )}
      {step.kind === 'end' && (
        <div className="rounded-xl border border-ok/50 bg-ok-soft px-4 py-3 text-sm">
          <strong className="text-ok">You’ve reached the end of the learning path.</strong>{' '}
          <Link to="/problems" className="text-link hover:underline">
            Practise with the interview problems →
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>In reading order:</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          {prev && (
            <Link to={`/topic/${prev.id}`} className="hover:text-ink hover:underline">
              ← {prev.title}
            </Link>
          )}
          {next && (
            <Link to={`/topic/${next.id}`} className="hover:text-ink hover:underline">
              {next.title} →
            </Link>
          )}
        </span>
      </div>
    </nav>
  )
}
