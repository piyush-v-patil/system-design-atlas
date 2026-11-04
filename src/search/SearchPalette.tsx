import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { search, type ResultKind, type SearchResult } from './searchIndex.ts'

const KIND_LABEL: Record<ResultKind, string> = { topic: 'Topic', problem: 'Problem', ood: 'OOD', term: 'Term' }
const KIND_STYLE: Record<ResultKind, string> = {
  topic: 'bg-accent-soft text-[var(--accent)]',
  problem: 'bg-ok-soft text-ok',
  ood: 'bg-warn-soft text-warn',
  term: 'bg-surface-2 text-muted',
}

/** Wrap the query's words where they start a word in `text`. */
function mark(text: string, words: string[]): ReactNode {
  if (!words.length) return text
  const re = new RegExp(`(^|[^a-z0-9])(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts: ReactNode[] = []
  let at = 0
  for (const m of text.matchAll(re)) {
    const start = m.index! + m[1].length
    parts.push(text.slice(at, start), <mark key={start} className="rounded-sm bg-[var(--mark)] px-0.5 text-inherit">{m[2]}</mark>)
    at = start + m[2].length
  }
  parts.push(text.slice(at))
  return parts
}

/** Search everything: Ctrl/Cmd+K or "/" opens it, arrows move, Enter opens, Escape closes. */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const results = useMemo<SearchResult[]>(() => search(q), [q])
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  useEffect(() => input.current?.focus(), [])
  useEffect(() => setActive(0), [q])
  useEffect(() => {
    list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const open = (r: SearchResult) => {
    onClose()
    navigate(r.entry.to)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(results.length - 1, a + 1)))
    else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)))
    else if (e.key === 'Enter' && results[active]) (e.preventDefault(), open(results[active]))
    else if (e.key === 'Escape') (e.preventDefault(), onClose())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-3 pt-[10vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search" className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl" style={{ animation: 'fade-up 160ms ease-out both' }}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search topics, problems and terms…"
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${active}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">Esc</kbd>
        </div>
        {q.trim() === '' ? (
          <p className="px-4 py-6 text-sm text-muted">Try “cache”, “sharding”, “consistent”, “twitter” or “TCP”.</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">Nothing matches “{q}”.</p>
        ) : (
          <ul ref={list} id="search-results" role="listbox" aria-label="Results" className="overflow-y-auto p-2">
            {results.map((r, i) => (
              <li key={r.entry.key} id={`sr-${i}`} role="option" aria-selected={i === active} data-i={i}>
                <button
                  type="button"
                  onMouseMove={() => setActive(i)}
                  onClick={() => open(r)}
                  className={`flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-surface-2' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${KIND_STYLE[r.entry.kind]}`}>{KIND_LABEL[r.entry.kind]}</span>
                    <span className="truncate font-medium">{mark(r.entry.title, words)}</span>
                  </span>
                  {r.entry.where && <span className="truncate text-xs text-muted">{r.entry.where}</span>}
                  {r.snippet && <span className="line-clamp-2 text-[13px] text-muted">{mark(r.snippet, words)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-4 border-t border-line px-4 py-2 text-[11px] text-muted">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span className="ml-auto">{results.length > 0 && `${results.length}${results.length === 30 ? '+' : ''} results`}</span>
        </div>
      </div>
    </div>
  )
}
