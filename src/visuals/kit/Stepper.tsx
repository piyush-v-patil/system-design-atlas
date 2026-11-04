import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ProcessStep } from '../../../content/visuals/types.ts'
import { useStepHighlight } from './highlight.tsx'
import { FitBox, FullscreenButton, useFullscreen } from './Fullscreen.tsx'

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

const btn = 'btn btn-sm btn-secondary'

export function StepControls({ s }: { s: Stepper }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Animation controls">
      {s.playing ? (
        <button className="btn btn-sm btn-secondary" aria-pressed="true" onClick={s.pause}>
          <svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden>
            <rect x="2" y="1.5" width="3" height="9" rx="0.5" />
            <rect x="7" y="1.5" width="3" height="9" rx="0.5" />
          </svg>
          Pause
        </button>
      ) : (
        <button className="btn btn-sm btn-primary" onClick={s.play}>
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
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.625rem] font-bold ${active ? 'bg-[var(--accent)] text-on-accent' : done ? 'bg-surface-2 text-ink' : 'bg-surface-2 text-muted'}`}
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

/**
 * Diagram + controls + live caption + step list, wired to the Original-panel highlight. Full screen enlarges the
 * diagram to fill the screen, with the controls under it and the step list beside it (below it on narrow screens).
 */
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
  const box = useRef<HTMLDivElement>(null)
  const fs = useFullscreen(box)
  const on = fs.active
  return (
    <div
      ref={box}
      className={`flex bg-surface ${
        on ? `h-full w-full flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:gap-6 lg:p-6 ${fs.pinned ? 'fixed inset-0 z-50' : ''}` : 'flex-col gap-3 rounded-xl border border-line p-3 sm:p-4'
      }`}
      aria-label={on ? 'Animation, full screen' : undefined}
    >
      <div className={`flex min-w-0 flex-col gap-3 ${on ? 'min-h-0 flex-1' : ''}`}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">{header}</div>
          <FullscreenButton active={on} onClick={fs.toggle} />
        </div>
        <FitBox active={on}>
          <div className="rounded-lg bg-bg/60 p-1">{children}</div>
        </FitBox>
        <StepControls s={stepper} />
        <p key={stepper.step} className={`min-h-[1.25rem] font-medium ${on ? 'text-base' : 'text-sm'}`} style={{ animation: 'fade-up 250ms ease-out both' }} aria-live="polite">
          {current ? current.caption : 'Press Play, or Step through one line of the text at a time.'}
        </p>
      </div>
      <div className={on ? 'flex max-h-[38vh] min-h-0 flex-col gap-3 overflow-y-auto lg:max-h-none lg:w-[24rem] lg:shrink-0' : 'contents'}>
        {on && <div className="text-label font-semibold tracking-wider text-muted uppercase">Steps</div>}
        {/* Extra notes come after the steps in full screen, so the steps stay at the top. */}
        <div className={on ? 'order-last' : 'contents'}>{aside}</div>
        <StepList steps={steps} s={stepper} />
      </div>
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
    <div
      className="grid w-full auto-cols-fr grid-flow-col rounded-lg border border-line bg-surface-2 p-0.5 text-xs sm:inline-grid sm:w-auto sm:auto-cols-auto"
      role="radiogroup"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-7 rounded-md px-2.5 py-1 text-center leading-tight font-medium ${value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
