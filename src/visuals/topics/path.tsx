import { Link } from 'react-router-dom'
import type { VisualProps } from '../registry.tsx'
import { areaColor, topics } from '../../lib/content.ts'
import { PATH, PATH_ORDER } from '../../lib/learningPath.ts'
import { setTimeline, useRead, useTimeline } from '../../lib/progress.ts'
import { VIA_PATH } from '../../lib/journey.ts'
import { TIMELINES, type Timeline } from '../../../content/visuals/_shared/path.ts'
import { ClaimText, LineRef } from '../kit/Claims.tsx'
import { ModeToggle } from '../kit/Stepper.tsx'
import { q } from '../../../content/visuals/types.ts'

export function TimelineToggle() {
  const t = useTimeline()
  return (
    <div className="flex flex-col gap-1.5">
      <ModeToggle
        label="Your interview timeline"
        value={t}
        onChange={setTimeline}
        options={(Object.keys(TIMELINES) as Timeline[]).map((k) => ({ value: k, label: TIMELINES[k].label }))}
      />
      <p className="text-xs text-muted">
        <ClaimText claim={TIMELINES[t].claim} />
      </p>
    </div>
  )
}

/** The study guide's table (README 208–216), parsed verbatim from the source. */
export interface StudyRow {
  label: string
  anchor: string | null
  line: number
  values: Record<Timeline, string>
}
export function parseStudyGuide(): StudyRow[] {
  const n = topics.nodes['study-guide']
  const lines = n.markdown.split('\n')
  const rows: StudyRow[] = []
  lines.forEach((l, i) => {
    const cells = l.split('|').map((c) => c.trim())
    if (cells.length < 6 || !cells[1] || cells[1] === '---' || /^-+$/.test(cells[1]) || cells[2] === 'Short') return
    const anchor = /\]\(#([^)]+)\)/.exec(cells[1])?.[1] ?? null
    const label = cells[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    const v = (s: string) => (s === ':+1:' ? '✓' : s)
    rows.push({ label, anchor, line: n.sourceLines[0] + i, values: { short: v(cells[2]), medium: v(cells[3]), long: v(cells[4]) } })
  })
  return rows
}

export function StudyGuideVisual(_: VisualProps) {
  const t = useTimeline()
  const rows = parseStudyGuide()
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <TimelineToggle />
      <ol className="flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start gap-3 rounded-lg border border-line px-3 py-2 text-sm">
            <span
              className={`mt-0.5 grid h-5 min-w-12 shrink-0 place-items-center rounded-full px-2 text-[11px] font-bold ${r.values[t] === '✓' ? 'bg-[var(--ok-soft)] text-ok' : 'bg-accent-soft text-[var(--accent)]'}`}
            >
              {r.values[t]}
            </span>
            <span className="min-w-0">
              {r.anchor && topics.nodes[r.anchor] ? (
                <Link className="text-link hover:underline" to={`/topic/${r.anchor}`}>
                  {r.label}
                </Link>
              ) : (
                r.label
              )}
              <LineRef claim={q(r.label, r.line)} />
            </span>
          </li>
        ))}
      </ol>
      <Link to="/path" className="btn btn-primary self-start">
        Follow this as a learning path →
      </Link>
    </div>
  )
}

/** Compact stage list with progress; used on the Primer's guide cards. */
export function LearningPathVisual({ visual }: VisualProps) {
  const read = useRead()
  const highlight = visual.props?.stage as string | undefined
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">The learning path</h3>
        <Link to="/path" className="text-xs text-link hover:underline">
          Open full path →
        </Link>
      </div>
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {PATH.map((s) => {
          const done = s.breadth.filter((id) => read.has(id)).length
          const first = s.breadth.find((id) => !read.has(id)) ?? s.breadth[0]
          const area = topics.nodes[s.breadth[0]]?.area ?? 'guide'
          return (
            <li key={s.id}>
              <Link
                to={`/topic/${first}`}
                state={VIA_PATH}
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm hover:border-[var(--accent)] ${highlight === s.id ? 'border-[var(--accent)] bg-accent-soft' : 'border-line'}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: areaColor(area) }}>
                  {s.index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.title}</span>
                  <span className="block h-1 rounded-full bg-surface-2">
                    <span className="block h-1 rounded-full bg-[var(--ok)] transition-all" style={{ width: `${(100 * done) / s.breadth.length}%` }} />
                  </span>
                </span>
                <span className="text-[11px] text-muted tabular-nums">
                  {done}/{s.breadth.length}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
      <p className="text-[11px] text-muted">
        {PATH_ORDER.length} topics, in reading order. Progress is saved in this browser as you read.
      </p>
    </div>
  )
}
