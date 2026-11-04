import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GlossaryEntry } from '../../content/glossary.ts'

/**
 * A linked concept explained in place: clicking the term opens a short explanation, with the full article one more
 * click away. Ctrl/Cmd-click still opens the link directly.
 */
export function GlossaryLink({ href, entry, children }: { href: string; entry: GlossaryEntry; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <span ref={box} className="relative inline">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-expanded={open}
        data-glossary={href}
        className="glossary-term cursor-help decoration-dotted underline-offset-4"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return
          e.preventDefault()
          setOpen((o) => !o)
        }}
      >
        {children}
      </a>
      {open && (
        <span
          role="dialog"
          aria-label={entry.term}
          className="glossary-pop not-prose absolute top-full left-0 z-30 mt-1.5 block w-[min(22rem,80vw)] rounded-xl border border-line bg-surface p-3 text-left text-sm leading-relaxed font-normal text-ink shadow-xl"
          style={{ animation: 'fade-up 160ms ease-out both' }}
        >
          <span className="block font-semibold">{entry.term}</span>
          {entry.text.map((t, i) => (
            <span key={i} className="mt-1.5 block text-[13px] text-muted">
              {t}
            </span>
          ))}
          <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-link hover:underline">
            Read more ↗
          </a>
        </span>
      )}
    </span>
  )
}
