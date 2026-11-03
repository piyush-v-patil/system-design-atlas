import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { githubBlob, oodById, oods } from '../lib/content.ts'
import { CodeBlock, PrimerMarkdown } from '../card/PrimerMarkdown.tsx'

/** Phase 1: the notebook rendered verbatim (markdown cells + code + output), with the sibling .py in a tab. */
export function OodPage() {
  const { id } = useParams()
  const ood = id ? oodById.get(id) : undefined
  const [tab, setTab] = useState<'notebook' | 'module'>('notebook')
  if (!ood) return <p className="p-6">No OOD problem with id “{id}”.</p>
  const idx = oods.indexOf(ood)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link to="/problems" className="hover:underline">
          Problems
        </Link>{' '}
        › Object-oriented design
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{ood.title}</h1>
      {ood.readmeTitle !== ood.title && <p className="mt-1 text-sm text-muted">Listed in the Primer as “{ood.readmeTitle}”</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-line text-sm" role="tablist">
        <button role="tab" aria-selected={tab === 'notebook'} onClick={() => setTab('notebook')} className={`-mb-px border-b-2 px-1 pb-2 ${tab === 'notebook' ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-muted'}`}>
          Notebook (as linked from the Primer)
        </button>
        {ood.module && (
          <button role="tab" aria-selected={tab === 'module'} onClick={() => setTab('module')} className={`-mb-px border-b-2 px-1 pb-2 ${tab === 'module' ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-muted'}`}>
            {ood.module.path.split('/').pop()} module
          </button>
        )}
      </div>

      {tab === 'notebook' ? (
        <article className="primer prose prose-sm mt-4 max-w-none md:prose-base" data-ood-id={ood.id}>
          <p className="text-xs text-muted not-prose">
            <a className="hover:underline" href={githubBlob(ood.source.path)} target="_blank" rel="noopener noreferrer">
              {ood.source.path} ↗
            </a>
          </p>
          <PrimerMarkdown markdown={ood.markdown} docPath={ood.source.path} />
        </article>
      ) : (
        ood.module && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">
              The repository also ships this module next to the notebook. It differs slightly from the notebook cell (for
              example stubs written as <code>pass</code> instead of <code># ...</code>); both are shown unchanged.{' '}
              <a className="text-link hover:underline" href={githubBlob(ood.module.path)} target="_blank" rel="noopener noreferrer">
                {ood.module.path} ↗
              </a>
            </p>
            <CodeBlock lang="python" code={ood.module.code} />
          </div>
        )
      )}

      <nav aria-label="Other problems" className="mt-10 grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
        {idx > 0 ? (
          <Link className="rounded-lg p-2 hover:bg-surface-2" to={`/ood/${oods[idx - 1].id}`}>
            <span className="block text-xs text-muted">← Previous</span>
            {oods[idx - 1].title}
          </Link>
        ) : (
          <span />
        )}
        {idx < oods.length - 1 && (
          <Link className="rounded-lg p-2 text-right hover:bg-surface-2" to={`/ood/${oods[idx + 1].id}`}>
            <span className="block text-xs text-muted">Next →</span>
            {oods[idx + 1].title}
          </Link>
        )}
      </nav>
    </div>
  )
}
