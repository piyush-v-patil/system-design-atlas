import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { getVisual } from '../../../content/visuals/index.ts'
import { bullets, domainOf, links, resourceKind, table } from '../auto.ts'
import { ClaimText, LineRef } from '../kit/Claims.tsx'
import { q } from '../../../content/visuals/types.ts'
import { PrimerMarkdown } from '../../card/PrimerMarkdown.tsx'

/** "Disadvantage(s): …" sections: each bullet as a con, quoted from its own line. */
export function ConsList({ node }: VisualProps) {
  const parent = node.parentId ? topics.nodes[node.parentId] : undefined
  const items = bullets(node)
  const parentHasVisual = parent && getVisual(parent.id)?.component
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      {parent && (
        <p className="text-sm text-muted">
          The Primer’s list of drawbacks for{' '}
          <Link to={`/topic/${parent.id}`} className="font-medium text-link hover:underline">
            {parent.title}
          </Link>
          {parentHasVisual ? ', which has its own animated visual.' : '.'}
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {items.map((b, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-lg border border-[var(--bad)]/25 bg-[var(--bad-soft)]/40 px-3 py-2 text-sm"
            style={{ marginLeft: b.depth * 20, animation: `fade-up 300ms ease-out ${i * 60}ms both` }}
          >
            <span aria-hidden className="mt-0.5 font-bold text-bad">
              {b.depth ? '↳' : '−'}
            </span>
            <span className="min-w-0 [&_p]:m-0">
              <span className="primer [&_a]:text-link">
                <PrimerMarkdown markdown={b.md} docPath="README.md" />
              </span>
              <LineRef claim={b.claim} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** "Source(s) and further reading": the links as cards with type and domain. */
export function ReadingList({ node, visual }: VisualProps) {
  const items = links(node)
  const parent = node.parentId ? topics.nodes[node.parentId] : undefined
  const grid = visual.props?.grid === true
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      {parent && node.kind === 'sources' && (
        <p className="text-sm text-muted">
          Where the Primer goes deeper on{' '}
          <Link to={`/topic/${parent.id}`} className="font-medium text-link hover:underline">
            {parent.title}
          </Link>
          . {items.length} link{items.length === 1 ? '' : 's'}, opening in a new tab.
        </p>
      )}
      <ul className={`grid gap-2 ${grid ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {items.map((l, i) => {
          const k = resourceKind(l.url)
          const internal = l.url.startsWith('#') || !/^https?:/.test(l.url)
          return (
            <li key={i} style={{ animation: `fade-up 300ms ease-out ${Math.min(i, 12) * 40}ms both` }}>
              {internal ? (
                <span className="primer block rounded-lg border border-line px-3 py-2 text-sm">
                  <PrimerMarkdown markdown={`[${l.title}](${l.url})`} docPath="README.md" />
                </span>
              ) : (
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-2.5 rounded-lg border border-line px-3 py-2 hover:border-[var(--accent)] hover:bg-surface-2"
                >
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-2 text-xs font-bold text-muted">
                    {k.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-snug group-hover:text-link">{l.title}</span>
                    <span className="block truncate text-[11px] text-muted">
                      {k.label} · {domainOf(l.url)}
                      {l.note && ` · ${l.note}`}
                    </span>
                  </span>
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type Bullet = ReturnType<typeof bullets>[number]
/** Top-level bullets with their nested bullets underneath. */
function nest(items: Bullet[]): { item: Bullet; index: number; children: { item: Bullet; index: number }[] }[] {
  const out: { item: Bullet; index: number; children: { item: Bullet; index: number }[] }[] = []
  items.forEach((b, i) => {
    if (b.depth === 0 || !out.length) out.push({ item: b, index: i, children: [] })
    else out[out.length - 1].children.push({ item: b, index: i })
  })
  return out
}

/** Bullet lists or hand-picked claims as key points (optionally a checklist). Nested bullets stay under their parent. */
export function KeyPoints({ node, visual }: VisualProps) {
  const auto = bullets(node)
  const checklist = visual.props?.checklist === true
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const groups = nest(auto)
  const nested = groups.some((g) => g.children.length > 0)
  const icons = (visual.props?.icons as string | undefined)?.split(',')
  const text = (b: Bullet) => (
    <span className="min-w-0 [&_p]:m-0">
      <span className="primer [&_a]:text-link">
        <PrimerMarkdown markdown={b.md} docPath="README.md" />
      </span>
      <LineRef claim={b.claim} />
    </span>
  )
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <ul className={`grid gap-2 ${groups.length > 3 && !checklist && !nested ? 'sm:grid-cols-2' : ''}`}>
        {groups.map(({ item: b, index: i, children }, gi) => (
          <li
            key={i}
            style={{ animation: `fade-up 300ms ease-out ${Math.min(gi, 10) * 50}ms both` }}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${checked.has(i) ? 'border-[var(--ok)]/50 bg-[var(--ok-soft)]' : 'border-line'}`}
          >
            <div className="flex items-start gap-2.5">
              {checklist ? (
                <input
                  type="checkbox"
                  aria-label={b.claim.text}
                  className="mt-1 accent-[var(--ok)]"
                  checked={checked.has(i)}
                  onChange={() => setChecked((s) => (s.has(i) ? (s.delete(i), new Set(s)) : new Set(s).add(i)))}
                />
              ) : (
                <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[10px] font-bold text-[var(--accent)]">
                  {icons?.[gi] ?? gi + 1}
                </span>
              )}
              {text(b)}
            </div>
            {children.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1 border-l-2 border-line pl-3 sm:ml-7">
                {children.map(({ item: c, index: ci }) => (
                  <li key={ci} className="flex items-start gap-2" style={{ marginLeft: (c.depth - 1) * 14 }}>
                    <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[var(--accent)]/60" />
                    {text(c)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {visual.points?.map((c, i) => (
        <p key={`p${i}`} className="text-sm">
          <ClaimText claim={c} />
        </p>
      ))}
    </div>
  )
}

/**
 * A study resource the Primer points to (the scalability lecture and article): the resource itself as the main
 * action, then what it covers, each with where the Atlas covers that topic (our mapping, labelled as such).
 */
export function StudyResource({ node, visual }: VisualProps) {
  const all = links(node)
  const main = all[0]
  const covers = new Map(
    String(visual.props?.covers ?? '')
      .split('|')
      .filter(Boolean)
      .map((pair) => {
        const [label, ids] = pair.split('=')
        return [label, ids.split(',')] as const
      }),
  )
  const items = bullets(node).filter((b) => b.depth > 0)
  if (!main) return null
  const k = resourceKind(main.url)
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <a
        href={main.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl border border-[var(--accent)]/50 bg-accent-soft/50 p-3 hover:border-[var(--accent)]"
      >
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-lg text-white">
          {visual.props?.kind === 'Video lecture' ? '▶' : '¶'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted">
            {String(visual.props?.kind ?? k.label)} · {domainOf(main.url)} · opens in a new tab
          </span>
          <span className="block text-base font-semibold group-hover:text-link">{main.title}</span>
        </span>
        <span aria-hidden className="text-lg text-[var(--accent)]">
          ↗
        </span>
      </a>
      <div>
        <h3 className="text-sm font-semibold">What it covers</h3>
        <p className="text-xs text-muted">From the Primer’s list. The “in the Atlas” links are our pointers to where the Primer covers the same idea.</p>
        <ul className="mt-2 flex flex-col divide-y divide-line rounded-lg border border-line">
          {items.map((b, i) => {
            const label = b.claim.text
            const ext = links({ ...node, markdown: b.md } as typeof node)[0]
            const ids = covers.get(label) ?? []
            return (
              <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <span className="font-medium">
                  {ext ? (
                    <a href={ext.url} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                      {label} ↗
                    </a>
                  ) : (
                    label
                  )}
                  <LineRef claim={b.claim} />
                </span>
                {ids.length > 0 && (
                  <span className="flex flex-wrap gap-1.5 text-xs">
                    <span className="text-muted">in the Atlas:</span>
                    {ids.map((id) => (
                      <Link key={id} to={`/topic/${id}`} className="rounded-full border border-line px-2 py-0.5 hover:border-[var(--accent)] hover:text-link">
                        {topics.nodes[id]?.title ?? id}
                      </Link>
                    ))}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** A table from the source as searchable cards; optional filter chips from one column. */
export function TableExplorer({ node, visual }: VisualProps) {
  const data = useMemo(() => table(node), [node])
  const [query, setQuery] = useState('')
  const groupCol = visual.props?.groupBy as number | undefined
  const [group, setGroup] = useState<string | null>(null)
  if (!data) return null
  const groups = groupCol !== undefined ? [...new Set(data.rows.map((r) => r.cells[groupCol]).filter(Boolean))] : []
  const needle = query.trim().toLowerCase()
  const rows = data.rows.filter(
    (r) => (!needle || r.cells.join(' ').toLowerCase().includes(needle)) && (!group || r.cells[groupCol!] === group),
  )
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${data.rows.length} rows…`}
          aria-label="Filter rows"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
        />
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {[null, ...groups].map((g) => (
              <button
                key={g ?? 'all'}
                onClick={() => setGroup(g)}
                className={`rounded-full border px-2.5 py-1 text-xs ${group === g ? 'border-[var(--accent)] bg-accent-soft font-semibold' : 'border-line hover:bg-surface-2'}`}
              >
                {g ?? 'All'}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.line} className="rounded-lg border border-line px-3 py-2 text-sm" style={{ animation: 'fade-up 250ms ease-out both' }}>
            {r.cells.map((c, j) =>
              j === groupCol || !c ? null : (
                <div key={j} className={`primer [&_p]:m-0 ${j === 0 || (groupCol === 0 && j === 1) ? 'font-medium' : 'mt-1 text-xs text-muted [&_a]:text-link'}`}>
                  <PrimerMarkdown markdown={c.replace(/<br\/>/g, ' · ')} docPath="README.md" />
                </div>
              ),
            )}
            <LineRef claim={q(r.cells.join(' '), r.line)} />
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="text-sm text-muted">No rows match.</p>}
    </div>
  )
}
