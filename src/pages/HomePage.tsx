import { useState } from 'react'
import { Link } from 'react-router-dom'
import { oodRefs, solutionRefs, topics } from '../lib/content.ts'
import { VIA_PATH } from '../lib/journey.ts'
import { PATH, PATH_ORDER, pathPosition, type PathStage } from '../lib/learningPath.ts'
import { resetProgress, usePathCursor, useRead } from '../lib/progress.ts'

/** Topics shown per stage before "+N more". */
const SHOWN = 8

/** The home page: the learning path as a book's contents page, with a Continue card beside it. */
export function HomePage() {
  const read = useRead()
  const cursor = usePathCursor()
  const next = cursor ?? PATH_ORDER.find((id) => !read.has(id)) ?? PATH_ORDER[0]
  const here = pathPosition(next)
  const current = here?.stage.index ?? 0
  const core = PATH.flatMap((s) => s.breadth)
  const coreRead = core.filter((id) => read.has(id)).length
  const started = read.size > 0 || cursor !== null

  return (
    // Phones: Continue, then the contents, then the other links. Wide screens: contents on the left, the rest beside it.
    <div className="mx-auto grid w-full max-w-[77.5rem] grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_18.75rem] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-3.5">
      <div className="lg:col-start-2 lg:row-start-1 lg:pt-10">
        <ContinueCard id={next} started={started} />
      </div>
      <main className="flex min-w-0 flex-col gap-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 lg:px-3.5">
          <h1 className="text-2xl font-semibold tracking-tight">Contents</h1>
          <span className="text-sm text-muted">
            Ten stages, read in order · {coreRead} of {core.length} core topics read
          </span>
        </div>
        <ol className="flex flex-col">
          {PATH.map((s) => (
            <Stage key={s.id} stage={s} read={read} next={next} current={s.index === current} />
          ))}
        </ol>
      </main>

      <aside className="flex flex-col gap-3.5 lg:col-start-2 lg:row-start-2">
        <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
          <Link to="/map" className="rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold hover:border-[var(--accent)]">
            Explore the map →<span className="mt-0.5 block text-ui font-normal text-muted">Every topic in one picture, for jumping around.</span>
          </Link>
          <Link to="/problems" className="rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold hover:border-[var(--accent)]">
            Practise →
            <span className="mt-0.5 block text-ui font-normal text-muted">
              {solutionRefs.length} design problems · {oodRefs.length} object-oriented design problems
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-ui text-muted">
            <Link to="/path" className="hover:text-ink hover:underline">
              Full plan, with optional depth
            </Link>
            {read.size > 0 && (
              <button type="button" onClick={resetProgress} className="hover:text-ink hover:underline">
                Reset progress
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function ContinueCard({ id, started }: { id: string; started: boolean }) {
  const pos = pathPosition(id)
  const stage = pos?.stage
  const read = useRead()
  const done = stage ? stage.breadth.filter((x) => read.has(x)).length : 0
  return (
    <Link
      to={`/topic/${id}`}
      state={VIA_PATH}
      className="flex flex-col gap-2 rounded-2xl border border-[var(--accent)]/40 bg-gradient-to-br from-accent-soft to-surface p-4.5 hover:border-[var(--accent)]"
    >
      <span className="text-label font-semibold tracking-wider text-[var(--accent)] uppercase">{started ? 'Continue reading' : 'Start reading'}</span>
      <span className="text-xl leading-tight font-semibold">{topics.nodes[id].title}</span>
      {stage && (
        <>
          <span className="text-ui text-muted">
            Stage {stage.index + 1} · {done} of {stage.breadth.length} read
          </span>
          <span className="h-1.5 rounded-full bg-line" aria-hidden>
            <span className="block h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${(done / stage.breadth.length) * 100}%` }} />
          </span>
        </>
      )}
      <span className="btn btn-primary mt-1 justify-center">{started ? 'Continue' : 'Start'} →</span>
    </Link>
  )
}

function Stage({ stage, read, next, current }: { stage: PathStage; read: ReadonlySet<string>; next: string; current: boolean }) {
  const [open, setOpen] = useState(false)
  const ids = stage.breadth
  const done = ids.filter((id) => read.has(id)).length
  const complete = done === ids.length
  const shown = open || ids.length <= SHOWN + 1 ? ids : ids.slice(0, SHOWN)
  const first = ids.find((id) => !read.has(id)) ?? ids[0]
  const status = complete ? (
    <span className="text-ok">Done</span>
  ) : done > 0 || current ? (
    <span className="text-[var(--accent)]">
      {done} of {ids.length} read
    </span>
  ) : (
    `${ids.length} topic${ids.length === 1 ? '' : 's'}`
  )
  return (
    <li
      id={`stage-${stage.id}`}
      className={`grid scroll-mt-4 grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 rounded-xl border px-3 py-2.5 sm:grid-cols-[3.375rem_minmax(0,1fr)_5.625rem] sm:gap-x-3.5 sm:px-3.5 ${current ? 'border-[var(--accent)]/50 bg-surface' : 'border-transparent'}`}
    >
      <span
        className={`text-[1.625rem] leading-none font-semibold tabular-nums ${complete ? 'text-ok' : current ? 'text-[var(--accent)]' : 'text-[var(--node-stroke)]'}`}
        aria-hidden
      >
        {String(stage.index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <Link to={`/topic/${first}`} state={VIA_PATH} className={`text-[0.9375rem] font-semibold hover:text-link ${complete ? 'text-muted' : ''}`}>
          <span className="sr-only">Stage {stage.index + 1}: </span>
          {stage.title}
        </Link>
        <ul className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1">
          {shown.map((id) => {
            const isRead = read.has(id)
            const isNext = id === next
            return (
              <li key={id}>
                <Link
                  to={`/topic/${id}`}
                  state={VIA_PATH}
                  className={`inline-flex items-center gap-1.5 text-ui hover:text-link hover:underline ${isNext ? 'font-semibold text-ink' : isRead ? 'text-muted' : 'text-ink/85'}`}
                >
                  {isRead ? (
                    <span className="text-ok" aria-label="read">
                      ✓
                    </span>
                  ) : isNext ? (
                    <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-label="next" />
                  ) : null}
                  {topics.nodes[id].title}
                </Link>
              </li>
            )
          })}
          {shown.length < ids.length && (
            <li>
              <button type="button" onClick={() => setOpen(true)} className="text-ui text-muted hover:text-ink hover:underline">
                +{ids.length - shown.length} more
              </button>
            </li>
          )}
        </ul>
      </div>
      <span className="col-start-2 mt-1 text-ui text-muted sm:col-start-auto sm:mt-0 sm:pt-0.5 sm:text-right">{status}</span>
    </li>
  )
}
