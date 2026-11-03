import { Link, useParams } from 'react-router-dom'
import { githubBlob, solutionById, solutions, topics } from '../lib/content.ts'
import { SectionBody } from '../card/OriginalPanel.tsx'
import type { SectionNode, SolutionFile } from '../lib/types.ts'

function subtree(doc: SolutionFile, id: string): SectionNode[] {
  return [doc.nodes[id], ...doc.nodes[id].childIds.flatMap((c) => subtree(doc, c))]
}

/**
 * Phase 1: the solution's original text, organised by the four interview steps. The step-through architecture
 * builder (Phase 4) will sit beside this text.
 */
export function SolutionPage() {
  const { id } = useParams()
  const sol = id ? solutionById.get(id) : undefined
  if (!sol) return <p className="p-6">No solution with id “{id}”.</p>
  const root = sol.nodes[sol.rootId]
  const idx = solutions.indexOf(sol)
  const readmeTopic = topics.nodes[sol.readmeTopicId]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link to="/problems" className="hover:underline">
          Problems
        </Link>{' '}
        › System design
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{root.title}</h1>
      {sol.readmeTitle !== root.title && (
        <p className="mt-1 text-sm text-muted">
          Listed in the Primer as{' '}
          <Link to={`/topic/${readmeTopic.id}`} className="text-link hover:underline">
            “{sol.readmeTitle}”
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
        <nav aria-label="Interview steps" className="md:sticky md:top-4 md:self-start">
          <ol className="flex gap-1.5 overflow-x-auto text-sm md:flex-col">
            {sol.steps.map((s) => (
              <li key={s.nodeId} className="shrink-0">
                <button
                  type="button"
                  onClick={() => document.getElementById(`orig-${s.nodeId}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">{s.step <= 4 ? s.step : '+'}</span>
                  <span className="leading-tight">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <a className="mt-3 block px-2 text-xs break-all text-muted hover:underline" href={githubBlob(sol.source.path)} target="_blank" rel="noopener noreferrer">
            {sol.source.path} ↗
          </a>
        </nav>

        <article className="primer prose prose-sm max-w-none min-w-0 md:prose-base" data-solution-id={sol.id}>
          <SectionBody doc={sol} node={root} baseLevel={0} showHeading={false} />
          {sol.steps.map((s) => (
            <div key={s.nodeId} className="mt-8 rounded-xl border border-line bg-surface px-5 py-1">
              {subtree(sol, s.nodeId).map((n) => (
                <SectionBody key={n.id} doc={sol} node={n} baseLevel={1} showHeading />
              ))}
            </div>
          ))}
        </article>
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
  )
}
