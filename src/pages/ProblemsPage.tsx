import { Link } from 'react-router-dom'
import { oods, solutions } from '../lib/content.ts'
import { ClassThumb, SolutionThumb } from '../solutions/ProblemThumb.tsx'

export function ProblemsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Practice problems</h1>
      <p className="mt-1 text-muted">Worked system design and object-oriented design interview questions.</p>

      <h2 className="mt-8 mb-3 text-lg font-semibold">System design</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {solutions.map((s) => {
          return (
            <li key={s.id}>
              <Link to={`/solutions/${s.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface hover:border-[var(--accent)]">
                <SolutionThumb id={s.id} />
                <span className="p-3 text-sm font-medium group-hover:text-link">{s.readmeTitle}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Object-oriented design</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {oods.map((o) => (
          <li key={o.id}>
            <Link to={`/ood/${o.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface hover:border-[var(--accent)]">
              <ClassThumb id={o.id} />
              <span className="p-3 text-sm font-medium group-hover:text-link">{o.readmeTitle}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
