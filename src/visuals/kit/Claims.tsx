import type { Claim } from '../../../content/visuals/types.ts'

/**
 * Claims keep their source lines for the accuracy tests (tests/visuals.test.ts), but the app presents the text as its
 * own: the line reference is not shown. Kept as a component so call sites stay unchanged.
 */
export function LineRef(_: { claim: Claim }) {
  return null
}

/** A sentence of the topic's text, shown as part of the page. */
export function ClaimText({ claim, className = '' }: { claim: Claim; className?: string }) {
  return <span className={className}>{claim.text}</span>
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
