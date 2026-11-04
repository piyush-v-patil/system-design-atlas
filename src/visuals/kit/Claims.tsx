import type { Claim } from '../../../content/visuals/types.ts'
import { githubBlob } from '../../lib/content.ts'

/** Line reference that links to the cited lines on GitHub at the pinned commit. */
export function LineRef({ claim }: { claim: Claim }) {
  const [a, b] = claim.lines
  const doc = claim.doc ?? 'README.md'
  return (
    <a
      href={githubBlob(doc, claim.lines)}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-1 font-mono text-[10px] whitespace-nowrap text-muted no-underline hover:text-link hover:underline"
      title={`${claim.basis === 'quoted' ? 'Quoted from' : 'Paraphrased from'} ${doc} line${a === b ? '' : 's'} ${a}${a === b ? '' : `–${b}`}`}
    >
      L{a}
      {a === b ? '' : `–${b}`}
    </a>
  )
}

/** A claim from the source. Paraphrases are marked so they can be reviewed against the original text. */
export function ClaimText({ claim, className = '' }: { claim: Claim; className?: string }) {
  return (
    <span className={className}>
      {claim.basis === 'paraphrased' && (
        <span className="mr-1 rounded bg-surface-2 px-1 text-[10px] font-medium text-muted" title="Paraphrased: not a verbatim quote">
          ≈
        </span>
      )}
      {claim.text}
      <LineRef claim={claim} />
    </span>
  )
}

export function UseWhen({ claim }: { claim: Claim }) {
  return (
    <div className="rounded-xl border border-[var(--accent)]/40 bg-accent-soft/50 px-4 py-3 text-sm">
      <span className="mr-2 text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">Use when</span>
      <ClaimText claim={claim} />
    </div>
  )
}

export function ProsCons({ pros, cons }: { pros?: Claim[]; cons?: Claim[] }) {
  if (!pros?.length && !cons?.length) return null
  const col = (title: string, items: Claim[] | undefined, tone: 'ok' | 'bad', icon: string) =>
    items?.length ? (
      <div className="min-w-0">
        <h3 className={`mb-2 text-xs font-semibold tracking-wide uppercase ${tone === 'ok' ? 'text-ok' : 'text-bad'}`}>{title}</h3>
        <ul className="flex flex-col gap-1.5 text-sm">
          {items.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className={`mt-0.5 font-bold ${tone === 'ok' ? 'text-ok' : 'text-bad'}`}>
                {icon}
              </span>
              <ClaimText claim={c} />
            </li>
          ))}
        </ul>
      </div>
    ) : null
  return (
    <div className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
      {col('Pros', pros, 'ok', '+')}
      {col('Cons', cons, 'bad', '−')}
    </div>
  )
}
