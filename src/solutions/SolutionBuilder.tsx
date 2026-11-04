import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Builder, Flow } from '../../content/builders/types.ts'
import type { Claim, ProcessStep } from '../../content/visuals/types.ts'
import { sourceText, topics } from '../lib/content.ts'
import { resolveLink } from '../lib/links.ts'
import { lineQuote } from '../lib/quote.ts'
import type { SolutionFile } from '../lib/types.ts'
import { ClaimText, LineRef } from '../visuals/kit/Claims.tsx'
import { useStepHighlight } from '../visuals/kit/highlight.tsx'
import { ProcessPlayer, useStepper } from '../visuals/kit/Stepper.tsx'
import { ArchitectureCanvas, frameSummary } from './ArchitectureCanvas.tsx'
import { firstFrameOfStep, flatLabel, labelAt, visibleAt } from './geometry.ts'

export const STEP_NAMES: Record<number, string> = {
  1: 'Use cases & constraints',
  2: 'High-level design',
  3: 'Core components',
  4: 'Scale the design',
  5: 'Talking points',
}

/** A verbatim quote of one README line. */
const quote = (sol: SolutionFile, src: string, line: number): Claim => ({ text: lineQuote(src, line), basis: 'quoted', lines: [line, line], doc: sol.source.path })

function fmt(v: number, unit: 'B' | 'req/s' | 'count'): string {
  const r = (x: number) => Number(x.toPrecision(3)).toLocaleString('en-US')
  if (unit === 'B') {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    let i = 0
    while (v >= 1000 && i < units.length - 1) {
      v /= 1000
      i++
    }
    return `${r(v)} ${units[i]}`
  }
  if (unit === 'req/s') return `${r(v)} per second`
  if (v >= 1e9) return `${r(v / 1e9)} billion`
  if (v >= 1e6) return `${r(v / 1e6)} million`
  return r(v)
}

/** Step tabs (1–4 + talking points); the AWS solution's Step 4 has one sub-tab per "Users+" stage. */
export function StepTabs({ b, frame, setFrame }: { b: Builder; frame: number; setFrame: (f: number) => void }) {
  const talking = frame === b.frames.length
  const current = talking ? 5 : b.frames[frame].step
  const subs = current <= 4 ? b.frames.map((f, i) => [f, i] as const).filter(([f]) => f.step === current) : []
  return (
    <div className="flex flex-col gap-2">
      <ol className="grid grid-cols-5 gap-1 rounded-xl border border-line bg-surface-2 p-1 text-xs sm:text-sm" aria-label="Interview steps">
        {[1, 2, 3, 4, 5].map((s) => {
          const target = s === 5 ? b.frames.length : firstFrameOfStep(b, s)
          const on = s === current
          return (
            <li key={s} className="min-w-0">
              <button
                type="button"
                onClick={() => setFrame(target)}
                aria-current={on ? 'step' : undefined}
                className={`flex h-full w-full flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center sm:flex-row sm:gap-2 sm:px-2 sm:text-left ${on ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold ${on ? 'bg-[var(--accent)] text-on-accent' : s < current ? 'bg-ok-soft text-ok' : 'bg-surface text-muted'}`}>
                  {s <= 4 ? s : '+'}
                </span>
                <span className="leading-tight">{STEP_NAMES[s]}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {subs.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 text-xs" role="tablist" aria-label="Stages">
          <span className="mr-1 text-muted">Stage:</span>
          {subs.map(([f, i]) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === frame}
              onClick={() => setFrame(i)}
              className={`rounded-full border px-2.5 py-1 font-mono ${i === frame ? 'border-[var(--accent)] bg-accent-soft text-ink' : 'border-line bg-surface text-muted hover:text-ink'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FrameNav({ b, frame, setFrame }: { b: Builder; frame: number; setFrame: (f: number) => void }) {
  const label = (i: number) => (i === b.frames.length ? STEP_NAMES[5] : b.frames[i].step === 4 && b.frames.filter((f) => f.step === 4).length > 1 ? b.frames[i].label : `Step ${b.frames[i].step}: ${b.frames[i].label}`)
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <button type="button" disabled={frame === 0} onClick={() => setFrame(frame - 1)} className="btn btn-secondary">
        ← Back
      </button>
      {frame < b.frames.length && (
        <button type="button" onClick={() => setFrame(frame + 1)} className="btn btn-primary">
          Next: {label(frame + 1)} →
        </button>
      )}
    </div>
  )
}

function MathPanel({ b, sol, src }: { b: Builder; sol: SolutionFile; src: string }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-3 sm:p-4" aria-label="Back-of-the-envelope check">
      <h3 className="text-sm font-semibold">Back-of-the-envelope, recomputed</h3>
      <p className="mt-0.5 text-xs text-muted">
        Each figure is worked out from the assumptions above, using 2.5 million seconds per month.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[32.5rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="py-1.5 pr-3 font-medium">Figure</th>
              <th className="py-1.5 pr-3 font-medium">How</th>
              <th className="py-1.5 pr-3 font-medium">Recomputed</th>
              <th className="py-1.5 font-medium">Rounded figure</th>
            </tr>
          </thead>
          <tbody>
            {b.math.map((m) => {
              const err = Math.abs(m.value - m.stated) / m.stated
              const exact = err < 0.005
              return (
                <tr key={m.label} className="border-b border-line/60 align-top last:border-0">
                  <td className="py-2 pr-3 font-medium">{m.label}</td>
                  <td className="py-2 pr-3 text-xs text-muted">
                    {m.formula}
                    <span className="ml-1 whitespace-nowrap">
                      {m.inputs.map((l) => (
                        <LineRef key={l} claim={{ text: '', basis: 'quoted', lines: [l, l], doc: sol.source.path }} />
                      ))}
                    </span>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                    <span className={exact ? 'text-ok' : 'text-warn'} aria-hidden>
                      {exact ? '✓' : '≈'}
                    </span>{' '}
                    {fmt(m.value, m.unit)}
                    {!exact && <span className="block text-[0.6875rem] text-muted">rounded ({Math.round(err * 100)}% off)</span>}
                  </td>
                  <td className="py-2 text-xs">
                    <ClaimText claim={quote(sol, src, m.line)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** A use case from Step 3 played hop by hop on the diagram; each hop highlights its sentence in the original text. */
function FlowRun({ b, sol, src, frame, flow, focus, header, aside }: { b: Builder; sol: SolutionFile; src: string; frame: number; flow: Flow; focus: ReadonlySet<string>; header: ReactNode; aside?: ReactNode }) {
  const name = (id: string) => flatLabel(labelAt(b.nodes.find((n) => n.id === id)!, frame))
  const steps: ProcessStep[] = flow.hops.map(([a, z, l]) => ({ caption: `${name(a)} → ${name(z)}`, source: quote(sol, src, l) }))
  const stepper = useStepper(steps.length, 2400)
  const hop = stepper.step > 0 ? flow.hops[stepper.step - 1] : null
  return (
    <ProcessPlayer steps={steps} stepper={stepper} header={header} aside={aside}>
      <ArchitectureCanvas builder={b} frame={frame} focus={focus} hop={hop ? { a: hop[0], b: hop[1], key: stepper.step } : null} title={`${sol.title}: ${flow.title}`} />
    </ProcessPlayer>
  )
}

function FlowPlayer({ b, sol, src, frame, flows, focus, aside }: { b: Builder; sol: SolutionFile; src: string; frame: number; flows: Flow[]; focus: ReadonlySet<string>; aside?: ReactNode }) {
  const [i, setI] = useState(0)
  const k = Math.min(i, flows.length - 1)
  const flow = flows[k]
  const header = (
    <div className="flex flex-col gap-2">
      {flows.length > 1 && (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Use cases">
          {flows.map((f, j) => (
            <button
              key={j}
              role="tab"
              aria-selected={j === k}
              onClick={() => setI(j)}
              className={`rounded-full border px-2.5 py-1 text-xs ${j === k ? 'border-[var(--accent)] bg-accent-soft font-medium text-ink' : 'border-line text-muted hover:text-ink'}`}
            >
              {f.title}
            </button>
          ))}
        </div>
      )}
      <p className="text-sm">
        <span className="mr-1.5 text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">Use case</span>
        {flow.title}
        <LineRef claim={{ text: flow.title, basis: 'quoted', lines: [flow.line, flow.line], doc: sol.source.path }} />
      </p>
    </div>
  )
  return <FlowRun key={`${frame}-${k}`} b={b} sol={sol} src={src} frame={frame} flow={flow} focus={focus} header={header} aside={aside} />
}

/** Topics the Step 4 section points to for talking points (its list of links into the Primer). */
function stepTopicLinks(sol: SolutionFile): { title: string; to: string }[] {
  const step4 = sol.steps.find((s) => s.step === 4)!
  const out: { title: string; to: string }[] = []
  for (const m of sol.nodes[step4.nodeId].markdown.matchAll(/^\* \[([^\]]+)\]\(([^)]+)\)\s*$/gm)) {
    const r = resolveLink(m[2], sol.source.path)
    if (r.kind === 'route') out.push({ title: m[1], to: r.to })
  }
  return out
}

function AdditionsPanel({ b, sol, src, frame, selected, setSelected }: { b: Builder; sol: SolutionFile; src: string; frame: number; selected: number | null; setSelected: (i: number | null) => void }) {
  const last = b.frames.length - 1
  const items = b.additions.map((a, i) => [a, i] as const).filter(([a]) => (a.frame ?? last) === frame)
  const links = frame === last ? stepTopicLinks(sol) : []
  if (!items.length && !links.length) return null
  const name = (id: string) => flatLabel(labelAt(b.nodes.find((n) => n.id === id)!, frame))
  const cur = items.find(([, i]) => i === selected)?.[0]
  return (
    <section className="rounded-xl border border-line bg-surface p-3 sm:p-4" aria-label="What this step adds">
      <h3 className="text-sm font-semibold">What changed, and why</h3>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Changes in this step">
        {items.map(([a, i]) => {
          const on = selected === i
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(on ? null : i)}
              aria-pressed={on}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? 'border-[var(--accent)] bg-[var(--accent)] text-on-accent' : 'border-ok/50 bg-ok-soft text-ok hover:border-ok'}`}
            >
              {a.nodes.map(name).join(' + ')}
            </button>
          )
        })}
      </div>
      <div className="mt-3 min-h-[3.5rem] rounded-lg bg-surface-2/60 px-3 py-2 text-[0.8125rem] leading-snug" aria-live="polite">
        {cur ? (
          <>
            <ClaimText claim={quote(sol, src, cur.line)} />
            {cur.topics.length > 0 && (
              <span className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                <span className="text-muted">Read:</span>
                {cur.topics.map((t) => (
                  <Link key={t} to={`/topic/${t}`} className="text-link hover:underline">
                    {topics.nodes[t].title}
                  </Link>
                ))}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted">Pick a change to highlight it on the diagram and see why it was added.</span>
        )}
      </div>
      {links.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <h4 className="text-xs font-semibold text-muted">Talking points the solution refers to</h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-[var(--accent)] hover:text-link">
                {l.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/** The builder: tabs for the four steps, the diagram as it stands at the selected step, and the step's panel. */
export function SolutionBuilder({ b, sol, frame, setFrame }: { b: Builder; sol: SolutionFile; frame: number; setFrame: (f: number) => void }) {
  const src = useMemo(() => sourceText(sol), [sol])
  const talking = frame === b.frames.length
  const f = Math.min(frame, b.frames.length - 1)
  const fr = b.frames[f]
  const [selected, setSelected] = useState<number | null>(null)
  const { setText } = useStepHighlight()
  useEffect(() => setSelected(null), [frame])
  useEffect(() => {
    setText(selected !== null ? lineQuote(src, b.additions[selected].line) : null)
  }, [selected, src, b, setText])
  const focus = useMemo(() => new Set(selected !== null ? b.additions[selected].nodes : []), [selected, b])
  const step3 = firstFrameOfStep(b, 3)
  const flows = talking ? [] : b.flows.filter((x) => (x.frame ?? step3) === f)
  const fresh = b.nodes.filter((n) => f > 0 && n.from === f)
  const shown = b.nodes.filter((n) => visibleAt(n, f)).length
  const additions = !talking && fr.step === 4 ? <AdditionsPanel b={b} sol={sol} src={src} frame={f} selected={selected} setSelected={setSelected} /> : null
  const title = `${sol.title}: ${talking ? 'final design' : `${STEP_NAMES[fr.step]}${fr.label !== STEP_NAMES[fr.step] ? ` (${fr.label})` : ''}`}`

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <StepTabs b={b} frame={frame} setFrame={setFrame} />
      {fr.note && !talking && <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-xs text-muted">{fr.note}</p>}
      {f === 0 && !talking ? (
        <>
          <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-xs text-muted">
            Step 1 draws nothing yet: scope the problem with the use cases and constraints (in the original text), then size it. The diagram starts in Step 2.
          </p>
          <MathPanel b={b} sol={sol} src={src} />
        </>
      ) : flows.length ? (
        <FlowPlayer b={b} sol={sol} src={src} frame={f} flows={flows} focus={focus} aside={additions} />
      ) : (
        <div className="rounded-xl border border-line bg-surface p-1 sm:p-2">
          <ArchitectureCanvas builder={b} frame={f} focus={focus} title={title} />
        </div>
      )}
      <p className="sr-only">Components shown: {frameSummary(b, f)}</p>
      {!flows.length && additions}
      <FrameNav b={b} frame={frame} setFrame={setFrame} />

      {!talking && fr.step === 2 && fresh.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-3 text-sm sm:p-4">
          <h3 className="text-sm font-semibold">The boxes of the high-level design</h3>
          <p className="mt-1 text-muted">{fresh.map((n) => flatLabel(n.label)).join(' · ')}</p>
        </section>
      )}
      {!talking && fr.step === 3 && fresh.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-3 text-sm sm:p-4">
          <h3 className="text-sm font-semibold">Core components added in Step 3</h3>
          <p className="mt-1 text-muted">{fresh.map((n) => flatLabel(n.label)).join(' · ')}</p>
        </section>
      )}
      {!talking && fr.lines && (
        <section className="rounded-xl border border-line bg-surface p-3 sm:p-4">
          <h3 className="text-sm font-semibold">Key points</h3>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
            {fr.lines.map((l) => (
              <li key={l}>
                <ClaimText claim={quote(sol, src, l)} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {talking && (
        <p className="rounded-xl border border-line bg-surface p-3 text-sm text-muted sm:p-4">
          The diagram shows the final design. The talking points are in the walkthrough.
        </p>
      )}
      {b.notes && b.notes.length > 0 && (
        <details className="rounded-xl border border-warn/40 bg-warn-soft/30 px-4 py-2.5 text-sm">
          <summary className="cursor-pointer font-medium select-none">Notes ({b.notes.length})</summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs">
            {b.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-[0.6875rem] text-muted">
        Shown so far: {shown} component{shown === 1 ? '' : 's'}.
      </p>
    </div>
  )
}
