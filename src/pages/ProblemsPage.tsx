import { Link } from 'react-router-dom'
import { imageSrc, oods, solutions } from '../lib/content.ts'

export function ProblemsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Practice problems</h1>
      <p className="mt-1 text-muted">The Primer’s worked system design and object-oriented design questions.</p>

      <h2 className="mt-8 mb-3 text-lg font-semibold">System design</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {solutions.map((s) => {
          const final = s.nodes[s.steps.find((x) => x.step === 4)!.nodeId].images[0]
          return (
            <li key={s.id}>
              <Link to={`/solutions/${s.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface hover:border-[var(--accent)]">
                <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-white p-2">
                  {final && <img src={imageSrc(final).src} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />}
                </div>
                <span className="p-3 text-sm font-medium group-hover:text-link">{s.readmeTitle}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Object-oriented design</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {oods.map((o) => (
          <li key={o.id}>
            <Link to={`/ood/${o.id}`} className="block rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium hover:border-[var(--accent)]">
              {o.readmeTitle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
