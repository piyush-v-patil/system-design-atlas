import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ProcessStep } from '../../../content/visuals/types.ts'
import { useStepHighlight } from './highlight.tsx'

export interface Stepper {
  step: number
  count: number
  playing: boolean
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  reset: () => void
  go: (s: number) => void
}

/** Step 0 is the starting state; steps 1..count each correspond to one ProcessStep. */
/** Autoplay waits `interval` ms per step: long enough for multi-hop packet animations (≤ ~2.7 s) to finish. */
export function useStepper(count: number, interval = 3000, initial = 0): Stepper {
  const [step, setStep] = useState(initial)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    if (step >= count) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 250 : interval)
    return () => clearTimeout(t)
  }, [playing, step, count, interval])
  const lastCount = useRef(count)
  useEffect(() => {
    if (lastCount.current === count) return
    lastCount.current = count
    setStep(0)
    setPlaying(false)
  }, [count])
  return {
    step,
    count,
    playing,
    play: () => {
      if (step >= count) setStep(0)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    next: () => (setPlaying(false), setStep((s) => Math.min(count, s + 1))),
    prev: () => (setPlaying(false), setStep((s) => Math.max(0, s - 1))),
    reset: () => (setPlaying(false), setStep(0)),
    go: (s) => (setPlaying(false), setStep(Math.max(0, Math.min(count, s)))),
  }
}

const base = 'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-40'
const btn = `${base} border-line bg-surface hover:bg-surface-2`

export function StepControls({ s }: { s: Stepper }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Animation controls">
      {s.playing ? (
        <button className={`${base} border-[var(--accent)] bg-surface text-[var(--accent)]`} onClick={s.pause}>
          <svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden>
            <rect x="2" y="1.5" width="3" height="9" rx="0.5" />
            <rect x="7" y="1.5" width="3" height="9" rx="0.5" />
          </svg>
          Pause
        </button>
      ) : (
        <button className={`${base} border-[var(--accent)] bg-[var(--accent)] text-white hover:opacity-90`} onClick={s.play}>
          <svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden>
            <path d="M3 1.5v9l7.5-4.5z" />
          </svg>
          {s.step >= s.count ? 'Replay' : 'Play'}
        </button>
      )}
      <button className={btn} onClick={s.prev} disabled={s.step === 0} aria-label="Previous step">
        ‹ Back
      </button>
      <button className={btn} onClick={s.next} disabled={s.step >= s.count} aria-label="Next step">
        Step ›
      </button>
      <button className={btn} onClick={s.reset} disabled={s.step === 0 && !s.playing}>
        Reset
      </button>
      <span className="ml-auto text-xs text-muted tabular-nums" aria-hidden>
        {s.step === 0 ? 'Ready' : `Step ${s.step} of ${s.count}`}
      </span>
    </div>
  )
}

/** The source sentence for each step; the active one is highlighted here and in the Original panel. */
export function StepList({ steps, s }: { steps: ProcessStep[]; s: Stepper }) {
  return (
    <ol className="flex flex-col gap-1 text-sm">
      {steps.map((st, i) => {
        const n = i + 1
        const active = s.step === n
        const done = s.step > n
        return (
          <li key={i}>
            <button
              onClick={() => s.go(n)}
              aria-current={active ? 'step' : undefined}
              className={`flex w-full gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${active ? 'border-[var(--accent)] bg-accent-soft' : 'border-transparent hover:bg-surface-2'}`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${active ? 'bg-[var(--accent)] text-white' : done ? 'bg-surface-2 text-ink' : 'bg-surface-2 text-muted'}`}
              >
                {n}
              </span>
              <span className="min-w-0">
                <span className={`block font-medium ${active || done ? '' : 'text-muted'}`}>{st.caption}</span>
                {st.source.text !== st.caption && <span className="block text-xs leading-snug text-muted">{st.source.text}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** Diagram + controls + live caption + step list, wired to the Original-panel highlight. */
export function ProcessPlayer({
  steps,
  stepper,
  header,
  children,
  aside,
}: {
  steps: ProcessStep[]
  stepper: Stepper
  header?: ReactNode
  children: ReactNode
  aside?: ReactNode
}) {
  const { setText } = useStepHighlight()
  const current = stepper.step > 0 ? steps[stepper.step - 1] : null
  useEffect(() => {
    setText(current && current.source.basis === 'quoted' ? current.source.text : null)
  }, [current, setText])
  useEffect(() => () => setText(null), [setText])
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      {header}
      <div className="rounded-lg bg-bg/60 p-1">{children}</div>
      <StepControls s={stepper} />
      <p key={stepper.step} className="min-h-[1.25rem] text-sm font-medium" style={{ animation: 'fade-up 250ms ease-out both' }} aria-live="polite">
        {current ? current.caption : 'Press Play, or Step through one line of the text at a time.'}
      </p>
      {aside}
      <StepList steps={steps} s={stepper} />
    </div>
  )
}

/** Segmented control for switching between modes of a visual (e.g. CP vs AP). */
export function ModeToggle<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-line bg-surface-2 p-0.5 text-xs" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 font-medium ${value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
