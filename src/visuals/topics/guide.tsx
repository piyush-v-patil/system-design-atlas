import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { VisualProps } from '../registry.tsx'
import { oodRefs, solutionRefs, topics } from '../../lib/content.ts'
import { SolutionThumb } from '../../solutions/ProblemThumb.tsx'
import { bullets } from '../auto.ts'
import { LineRef } from '../kit/Claims.tsx'

const STEP_IDS = [
  'step-1-outline-use-cases-constraints-and-assumptions',
  'step-2-create-a-high-level-design',
  'step-3-design-core-components',
  'step-4-scale-the-design',
]

/** The Primer's 4 interview steps; each links into the same step of every worked solution. */
export function InterviewSteps({ visual }: VisualProps) {
  const initial = Number(visual.props?.step ?? 1)
  const [active, setActive] = useState(initial)
  const node = topics.nodes[STEP_IDS[active - 1]]
  const items = bullets(node)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {STEP_IDS.map((id, i) => (
          <li key={id}>
            <button
              onClick={() => setActive(i + 1)}
              aria-pressed={active === i + 1}
              className={`flex h-full w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${active === i + 1 ? 'border-[var(--accent)] bg-accent-soft' : 'border-line hover:bg-surface-2'}`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold ${active === i + 1 ? 'bg-[var(--accent)] text-on-accent' : 'bg-surface-2'}`}>{i + 1}</span>
              <span className="font-medium leading-snug">{topics.nodes[id].title.replace(/^Step \d: /, '')}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="rounded-lg bg-surface-2/50 p-3" key={active} style={{ animation: 'fade-up 250ms ease-out both' }}>
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((b, i) => (
            <li key={i} style={{ marginLeft: `${b.depth}rem` }} className="flex gap-2">
              <span aria-hidden className="text-muted">
                {b.depth ? '–' : '•'}
              </span>
              <span>
                {b.claim.text}
                <LineRef claim={b.claim} />
              </span>
            </li>
          ))}
        </ul>
        <Link to={`/topic/${node.id}`} className="mt-2 inline-block text-xs text-link hover:underline">
          Open this step’s card →
        </Link>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold">See step {active} worked through in each solution</div>
        <div className="flex flex-wrap gap-1.5">
          {solutionRefs.map((s) => (
            <Link key={s.id} to={`/solutions/${s.id}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs hover:border-[var(--accent)] hover:bg-surface-2">
              {s.readmeTitle.replace(/^Design /, '')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProblemGallery(_: VisualProps) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {solutionRefs.map((s, i) => {
        return (
          <li key={s.id} style={{ animation: `fade-up 300ms ease-out ${i * 50}ms both` }}>
            <Link to={`/solutions/${s.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface hover:border-[var(--accent)]">
              <SolutionThumb id={s.id} />
              <span className="p-2 text-xs font-medium leading-snug group-hover:text-link">{s.readmeTitle}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function OodGallery(_: VisualProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {oodRefs.map((o, i) => {
        const classes = o.classes
        return (
          <li key={o.id} style={{ animation: `fade-up 300ms ease-out ${i * 50}ms both` }}>
            <Link to={`/ood/${o.id}`} className="group flex h-full flex-col gap-2 rounded-xl border border-line bg-surface p-3 hover:border-[var(--accent)]">
              <span className="text-sm font-semibold group-hover:text-link">{o.readmeTitle}</span>
              <span className="flex flex-wrap gap-1">
                {classes.map((c) => (
                  <span key={c} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem]">
                    {c}
                  </span>
                ))}
              </span>
              <span className="mt-auto text-[0.6875rem] text-muted">{classes.length} classes</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
