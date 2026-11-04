import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { classDiagrams } from '../../content/class-diagrams/index.ts'
import { githubBlob, oodById, oods } from '../lib/content.ts'
import type { OodFile } from '../lib/types.ts'
import { CodeBlock, PrimerMarkdown } from '../card/PrimerMarkdown.tsx'
import { ClassDiagram, memberText } from '../ood/ClassDiagram.tsx'
import { parsePython } from '../ood/parsePython.ts'
import { CodeSteps } from '../visuals/kit/CodeSteps.tsx'

/** The class diagram (read from the notebook's code) next to that code; selecting a class highlights its lines. */
function ClassView({ ood }: { ood: OodFile }) {
  const cell = ood.cells.find((c) => c.cellType === 'code' && /^class /m.test(c.source))
  const code = cell?.source ?? ''
  const classes = useMemo(() => parsePython(code), [code])
  const diagram = classDiagrams[ood.id]
  const [selected, setSelected] = useState<{ cls: string; line?: number } | null>(null)
  const codeBox = useRef<HTMLDivElement>(null)
  const cls = classes.find((c) => c.name === selected?.cls)
  const active = selected?.line ? [selected.line] : cls ? Array.from({ length: cls.end - cls.line + 1 }, (_, i) => cls.line + i) : []
  useEffect(() => {
    const first = active[0]
    const box = codeBox.current
    if (!first || !box) return
    const el = box.querySelectorAll('.line')[first - 1] as HTMLElement | undefined
    if (el) box.scrollTo({ top: Math.max(0, el.offsetTop - box.offsetTop - 48), behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])
  const intro = ood.cells.filter((c) => c.cellType === 'markdown' && !/^# /.test(c.source.trim()) && !/^This notebook was prepared by/.test(c.source) && c.source.trim() !== '## Solution')
  if (!cell) return null
  const counts = {
    classes: classes.length,
    inherit: classes.reduce((n, c) => n + c.bases.filter((b) => classes.some((x) => x.name === b)).length, 0),
    assoc: diagram?.associations.length ?? 0,
  }
  return (
    <div className="mt-4 flex flex-col gap-4" data-ood-id={ood.id}>
      {intro.length > 0 && (
        <details className="rounded-xl border border-line bg-surface">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold select-none hover:bg-surface-2">Constraints and assumptions (from the notebook)</summary>
          <div className="primer prose prose-sm max-w-none border-t border-line px-4 py-2">
            {intro.map((c, i) => (
              <PrimerMarkdown key={i} markdown={c.source} docPath={ood.source.path} />
            ))}
          </div>
        </details>
      )}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-surface p-2 sm:p-3" aria-label="Class diagram">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted">
            <span>
              {counts.classes} classes · {counts.inherit} inheritance links · {counts.assoc} associations
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="30" height="10" aria-hidden>
                <path d="M0 5h22" stroke="var(--text-muted)" strokeWidth="1.3" />
                <path d="M21 1l8 4-8 4z" fill="var(--surface)" stroke="var(--text-muted)" />
              </svg>
              inherits (read from the code)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="30" height="10" aria-hidden>
                <path d="M0 5h26" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="5 4" />
                <path d="M23 1l5 4-5 4" fill="none" stroke="var(--accent)" />
              </svg>
              holds (hand-drawn from attribute names; * = many)
            </span>
          </div>
          <div className="rounded-lg bg-bg/60 p-1">
            <ClassDiagram classes={classes} associations={diagram?.associations ?? []} selected={selected} onSelect={setSelected} title={`Class diagram: ${ood.title}`} />
          </div>
          <p className="min-h-[1.25rem] px-1 text-xs text-muted" aria-live="polite">
            {cls
              ? selected?.line
                ? `${cls.name}.${memberText(cls.members.find((m) => m.line === selected.line)!)} — line ${selected.line}`
                : `${cls.name} — lines ${cls.line}–${cls.end}${cls.bases.length ? `, extends ${cls.bases.join(', ')}` : ''}`
              : 'Click a class (or one of its members) to highlight it in the code. - attribute set in __init__, + method, ◦ property; italics = abstract.'}
          </p>
          {diagram?.notes && (
            <ul className="mx-1 mb-1 flex list-disc flex-col gap-1 rounded-lg bg-warn-soft/40 py-2 pr-3 pl-6 text-xs">
              {diagram.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="min-w-0 rounded-xl border border-line bg-surface lg:sticky lg:top-4" aria-label="Notebook code">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2 text-xs">
            <span className="font-semibold">Code</span>
          </div>
          <div ref={codeBox} className="relative max-h-[70vh] overflow-auto p-2">
            <CodeSteps code={code} active={active} />
          </div>
        </section>
      </div>
    </div>
  )
}

/** An OOD problem: class diagram next to the code (Phase 4), the notebook verbatim, and the sibling .py module. */
export function OodPage() {
  const { id } = useParams()
  const ood = id ? oodById.get(id) : undefined
  const [params, setParams] = useSearchParams()
  const view = params.get('view')
  const tab: 'classes' | 'notebook' | 'module' = view === 'notebook' || view === 'module' ? view : 'classes'
  const setTab = (t: typeof tab) => setParams((p) => (t === 'classes' ? p.delete('view') : p.set('view', t), p), { replace: true })
  if (!ood) return <p className="p-6">No OOD problem with id “{id}”.</p>
  const idx = oods.indexOf(ood)

  return (
    <div className={`mx-auto w-full px-4 py-6 md:px-8 ${tab === 'classes' ? 'max-w-[1440px]' : 'max-w-4xl'}`}>
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link to="/problems" className="hover:underline">
          Problems
        </Link>{' '}
        › Object-oriented design
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{ood.title}</h1>
      

      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-line text-sm" role="tablist">
        <button role="tab" aria-selected={tab === 'classes'} onClick={() => setTab('classes')} className={`-mb-px border-b-2 px-1 pb-2 ${tab === 'classes' ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-muted'}`}>
          Class diagram + code
        </button>
        <button role="tab" aria-selected={tab === 'notebook'} onClick={() => setTab('notebook')} className={`-mb-px border-b-2 px-1 pb-2 ${tab === 'notebook' ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-muted'}`}>
          Notebook
        </button>
        {ood.module && (
          <button role="tab" aria-selected={tab === 'module'} onClick={() => setTab('module')} className={`-mb-px border-b-2 px-1 pb-2 ${tab === 'module' ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-muted'}`}>
            {ood.module.path.split('/').pop()} module
          </button>
        )}
      </div>

      {tab === 'classes' ? (
        <ClassView key={ood.id} ood={ood} />
      ) : tab === 'notebook' ? (
        <article className="primer prose prose-sm mt-4 max-w-none md:prose-base" data-ood-id={ood.id}>
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
