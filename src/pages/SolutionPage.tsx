import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getBuilder } from '../../content/builders/index.ts'
import { githubBlob, solutionById, solutions, topics } from '../lib/content.ts'
import { SectionBody } from '../card/OriginalPanel.tsx'
import type { SectionNode, SolutionFile } from '../lib/types.ts'
import { SolutionBuilder } from '../solutions/SolutionBuilder.tsx'
import { StepHighlightProvider, useOriginalHighlight } from '../visuals/kit/highlight.tsx'

function subtree(doc: SolutionFile, id: string): SectionNode[] {
  return [doc.nodes[id], ...doc.nodes[id].childIds.flatMap((c) => subtree(doc, c))]
}

/**
 * The original text for the selected step. For a stage of a step (the AWS "Users+" sections) it shows the step's own
 * introduction followed by that stage's section. The whole solution is one click away.
 */
function OriginalColumn({ sol, stepId, subId, label }: { sol: SolutionFile; stepId: string; subId?: string; label: string }) {
  const [whole, setWhole] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useOriginalHighlight(ref, [stepId, subId, whole])
  const root = sol.nodes[sol.rootId]
  const step = sol.nodes[stepId]
  const sections = whole ? subtree(sol, sol.rootId).slice(1) : subId ? [step, ...subtree(sol, subId)] : subtree(sol, stepId)
  const last = sections[sections.length - 1]
  const lines: [number, number] = whole ? [1, last.sourceLines[1]] : [step.sourceLines[0], last.sourceLines[1]]
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="text-sm font-semibold">
          Original text <span className="font-normal text-muted">· {whole ? 'whole solution' : label}</span>
        </h2>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" className="accent-[var(--accent)]" checked={whole} onChange={(e) => setWhole(e.target.checked)} />
          Show the whole solution
        </label>
      </div>
      <div className="px-4 pt-2 pb-4">
        <a className="text-xs text-muted underline-offset-2 hover:underline" href={githubBlob(sol.source.path, lines)} target="_blank" rel="noopener noreferrer">
          {sol.source.path} · lines {lines[0]}–{lines[1]}
          {subId && !whole ? ' (with the step’s introduction)' : ''} ↗
        </a>
        <article ref={ref} className="primer prose prose-sm mt-2 max-w-none" data-solution-id={sol.id}>
          {whole && <SectionBody doc={sol} node={root} baseLevel={0} showHeading={false} />}
          {sections.map((s, i) => (
            <SectionBody key={s.id} doc={sol} node={s} baseLevel={whole ? 0 : step.level} showHeading={whole || i > 0} />
          ))}
        </article>
      </div>
    </div>
  )
}

/**
 * Phase 4: each system design solution as a step-through architecture builder. Each interview step reveals more of
 * the diagram; the solution's original text for that step sits alongside.
 */
export function SolutionPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const sol = id ? solutionById.get(id) : undefined
  if (!sol) return <p className="p-6">No solution with id “{id}”.</p>
  const b = getBuilder(sol.id)!
  const root = sol.nodes[sol.rootId]
  const idx = solutions.indexOf(sol)
  const readmeTopic = topics.nodes[sol.readmeTopicId]
  const frame = Math.max(0, Math.min(b.frames.length, Number(params.get('f') ?? 0) || 0))
  const setFrame = (f: number) => setParams((p) => (f ? p.set('f', String(f)) : p.delete('f'), p), { replace: true })

  const talking = frame === b.frames.length
  const fr = b.frames[Math.min(frame, b.frames.length - 1)]
  const stepNo = talking ? 5 : fr.step
  const stepNode = sol.steps.find((s) => s.step === stepNo)!
  const sub = !talking && fr.sectionTitle ? sol.order.find((nid) => sol.nodes[nid].title === fr.sectionTitle) : undefined
  const stepTitle = sol.nodes[stepNode.nodeId].title
  const label = sub ? `${stepTitle} › ${fr.sectionTitle}` : stepTitle

  return (
    <StepHighlightProvider>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
          <Link to="/problems" className="hover:underline">
            Problems
          </Link>{' '}
          › System design
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{root.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {sol.readmeTitle !== root.title && (
            <>
              Listed in the Primer as{' '}
              <Link to={`/topic/${readmeTopic.id}`} className="text-link hover:underline">
                “{sol.readmeTitle}”
              </Link>
              .{' '}
            </>
          )}
          Step through the interview: each step adds to the diagram, and the Primer’s text for that step is alongside.
        </p>

        <div className="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <SolutionBuilder key={sol.id} b={b} sol={sol} frame={frame} setFrame={setFrame} />
          <div className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:rounded-xl">
            <OriginalColumn key={`${stepNode.nodeId}-${sub}`} sol={sol} stepId={stepNode.nodeId} subId={sub} label={label} />
          </div>
        </div>

        <nav aria-label="Other problems" className="mt-10 grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
          {idx > 0 ? (
            <Link className="rounded-lg p-2 hover:bg-surface-2" to={`/solutions/${solutions[idx - 1].id}`}>
              <span className="block text-xs text-muted">← Previous problem</span>
              {solutions[idx - 1].readmeTitle}
            </Link>
          ) : (
            <span />
          )}
          {idx < solutions.length - 1 && (
            <Link className="rounded-lg p-2 text-right hover:bg-surface-2" to={`/solutions/${solutions[idx + 1].id}`}>
              <span className="block text-xs text-muted">Next problem →</span>
              {solutions[idx + 1].readmeTitle}
            </Link>
          )}
        </nav>
      </div>
    </StepHighlightProvider>
  )
}
