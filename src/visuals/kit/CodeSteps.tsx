import { useEffect, useId, useState } from 'react'
import { codeKey } from '../../lib/hash.ts'

type Highlights = Record<string, string>
let cache: Highlights | null = null

/** Code from the Primer with the lines for the current step highlighted (Shiki output when loaded). */
export function CodeSteps({ code, lang = 'python', active, title }: { code: string; lang?: string; active: number[]; title?: string }) {
  const id = 'c' + useId().replace(/:/g, '')
  const [hl, setHl] = useState<Highlights | null>(cache)
  useEffect(() => {
    if (cache) return
    let live = true
    import('../../../content/highlight.json')
      .then((m) => {
        cache = m.default as Highlights
        if (live) setHl(cache)
      })
      .catch(() => {
        /* stay plain if the chunk can't load */
      })
    return () => {
      live = false
    }
  }, [])
  const html = hl?.[codeKey(lang, code)]
  const css = active.length
    ? `${active.map((n) => `#${id} .line:nth-of-type(${n})`).join(',')}{background:var(--mark);box-shadow:inset 3px 0 0 var(--accent)}`
    : ''
  return (
    <figure className="code-steps m-0 min-w-0" id={id}>
      {title && <figcaption className="mb-1 text-xs font-semibold text-muted">{title}</figcaption>}
      <style>{css}</style>
      {html ? (
        <div className="[&_.shiki]:my-0 [&_.shiki]:text-[0.74rem]" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 text-[0.74rem] leading-[1.45]">
          <code>
            {code.split('\n').map((l, i) => (
              <span key={i} className="line">
                {l}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      )}
    </figure>
  )
}

/** The n-th fenced code block (0-based) in a markdown string, exactly as written. */
export function codeBlock(markdown: string, n = 0): string {
  const blocks = [...markdown.matchAll(/```[^\n]*\n([\s\S]*?)\n```/g)].map((m) => m[1])
  return blocks[n] ?? ''
}
