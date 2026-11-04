import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { areaColor, topics } from '../lib/content.ts'
import { PATH, PATH_ORDER } from '../lib/learningPath.ts'
import { resetProgress, usePathCursor, useRead, useTimeline } from '../lib/progress.ts'
import { VIA_PATH } from '../lib/journey.ts'
import { NOT_EVERYTHING, START_BROAD } from '../../content/visuals/_shared/path.ts'
import { ClaimText } from '../visuals/kit/Claims.tsx'
import { parseStudyGuide, TimelineToggle } from '../visuals/topics/path.tsx'
import type { TopicNode } from '../lib/types.ts'

function Chip({ n, read, muted }: { n: TopicNode; read: boolean; muted?: boolean }) {
  return (
    <Link
      to={`/topic/${n.id}`}
      state={VIA_PATH}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm transition-colors hover:border-[var(--accent)] hover:bg-surface-2 ${read ? 'border-[var(--ok)]/50 bg-[var(--ok-soft)]' : 'border-line'} ${muted ? 'opacity-70' : ''}`}
    >
      {read ? (
        <span aria-label="read" className="text-ok">
          ✓
        </span>
      ) : (
        <span aria-hidden className="size-2 rounded-full" style={{ background: areaColor(n.area) }} />
      )}
      {n.title}
    </Link>
  )
}

export function PathPage() {
  const read = useRead()
  const t = useTimeline()
  const breadthAll = PATH.flatMap((s) => s.breadth)
  const breadthRead = breadthAll.filter((id) => read.has(id)).length
  const cursor = usePathCursor()
  const next = cursor ?? PATH_ORDER[0]
  const study = parseStudyGuide()
  const practiceValue = (anchor: string) => study.find((r) => r.anchor === anchor)?.values[t]
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Learning path</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Not sure what to study, or in what order? This route follows the Primer’s own guidance: its “start here”
        section, then its topics in order, then practice from its study guide.
      </p>
      <div className="mt-4 grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-col gap-2 text-sm">
          <p>
            <ClaimText claim={NOT_EVERYTHING} />
          </p>
          <p>
            <ClaimText claim={START_BROAD} />
          </p>
          <TimelineToggle />
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="text-sm text-muted tabular-nums">
            {breadthRead} of {breadthAll.length} core topics read
          </div>
          <div className="h-2 w-48 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-[var(--ok)] transition-all" style={{ width: `${(100 * breadthRead) / breadthAll.length}%` }} />
          </div>
          <Link to={`/topic/${next}`} state={VIA_PATH} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
            {cursor ? 'Back to your place' : 'Start'}: {topics.nodes[next].title} →
          </Link>
          {read.size > 0 && (
            <button onClick={resetProgress} className="text-xs text-muted hover:text-bad">
              Reset progress
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        How “breadth” and “depth” are split here (our reading of the study guide): breadth is each section and its main
        subtopics; depth is the detailed subsections below them. Progress is stored only in this browser.
      </p>

      <ol className="relative mt-6 flex flex-col gap-4 border-l-2 border-line pl-6">
        {PATH.map((s) => {
          const done = s.breadth.filter((id) => read.has(id)).length
          const area = topics.nodes[s.breadth[0]]?.area ?? 'guide'
          const complete = done === s.breadth.length
          return (
            <li key={s.id} id={`stage-${s.id}`} className="relative scroll-mt-4">
              <span
                className="absolute top-3 -left-[37px] grid size-7 place-items-center rounded-full border-4 border-bg text-xs font-bold text-white"
                style={{ background: complete ? 'var(--ok)' : areaColor(area) }}
              >
                {complete ? '✓' : s.index + 1}
              </span>
              <section className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                  <span className="text-xs text-muted tabular-nums">
                    {done}/{s.breadth.length} core read
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  <ClaimText claim={s.why} />
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.breadth.map((id) => {
                    const v = s.id === 'practice' ? practiceValue(id) : undefined
                    return (
                      <span key={id} className="inline-flex items-center gap-1">
                        <Chip n={topics.nodes[id]} read={read.has(id)} />
                        {v && v !== '✓' && <span className="rounded-full bg-accent-soft px-1.5 text-[10px] font-bold text-[var(--accent)]">{v}</span>}
                      </span>
                    )
                  })}
                </div>
                {s.depth.length > 0 && (
                  <details className="group mt-3" open={t !== 'short'}>
                    <summary className="cursor-pointer text-xs font-semibold text-muted select-none hover:text-ink">
                      {t === 'short' ? 'Optional depth' : t === 'medium' ? 'Some depth: pick a few' : 'More depth'} ({s.depth.length})
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.depth.map((id) => (
                        <Chip key={id} n={topics.nodes[id]} read={read.has(id)} muted={t === 'short'} />
                      ))}
                    </div>
                  </details>
                )}
              </section>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
