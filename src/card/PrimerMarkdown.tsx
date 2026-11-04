import { isValidElement, useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkGemoji from 'remark-gemoji'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { codeKey } from '../lib/hash.ts'
import { imageSrc } from '../lib/content.ts'
import { resolveLink } from '../lib/links.ts'
import { normalizeInlineHtml } from '../lib/markdown-fixups.ts'

/** Allow only the raw HTML the Primer actually uses: <p align>, <img>, <br>, <i>, <sup>, <a>. */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    p: [...(defaultSchema.attributes?.p ?? []), 'align'],
    img: [...(defaultSchema.attributes?.img ?? []), 'align', 'src', 'alt'],
  },
}

type Highlights = Record<string, string>
let highlightCache: Highlights | null = null
let highlightPromise: Promise<Highlights> | null = null

/** Pre-highlighted code (built by scripts/highlight.ts) is loaded lazily; until then code renders plain. */
function useHighlights(): Highlights | null {
  const [h, setH] = useState<Highlights | null>(highlightCache)
  useEffect(() => {
    if (highlightCache) return
    // If the highlight chunk can't load (offline, flaky network), code simply stays plain.
    highlightPromise ??= import('../../content/highlight.json')
      .then((m) => (highlightCache = m.default as Highlights))
      .catch(() => {
        highlightPromise = null
        return {} as Highlights
      })
    let live = true
    highlightPromise.then((v) => live && setH(v))
    return () => {
      live = false
    }
  }, [])
  return h
}

export function CodeBlock({ lang, code }: { lang: string | null; code: string }) {
  const highlights = useHighlights()
  const html = lang ? highlights?.[codeKey(lang, code)] : undefined
  if (html) return <div className="not-prose my-4" dangerouslySetInnerHTML={{ __html: html }} />
  return (
    <pre className="not-prose my-4 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3.5 text-[0.8rem] leading-[1.45]">
      <code>{code}</code>
    </pre>
  )
}

function codeFromPre(children: ReactNode): { lang: string | null; code: string } | null {
  const el = (Array.isArray(children) ? children[0] : children) as ReactElement<{ className?: string; children?: ReactNode }>
  if (!isValidElement(el)) return null
  const { className, children: inner } = el.props
  const lang = /language-(\S+)/.exec(className ?? '')?.[1] ?? null
  const text = Array.isArray(inner) ? inner.join('') : String(inner ?? '')
  return { lang, code: text.replace(/\n$/, '') }
}

function components(docPath: string): Components {
  return {
    a({ href, children, node: _node, ...rest }) {
      if (!href) return <a {...rest}>{children}</a>
      const r = resolveLink(href, docPath)
      if (r.kind === 'route')
        return (
          <Link to={r.to} data-source-href={r.source} title={r.source}>
            {children}
          </Link>
        )
      return (
        <a href={r.href} data-source-href={r.source === r.href ? undefined : r.source} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
    img({ src, alt, node: _node, ...rest }) {
      const ref = typeof src === 'string' ? src : ''
      const { src: resolved, entry } = imageSrc(ref)
      const fallbackAlt = entry?.caption ?? 'Diagram from The System Design Primer'
      return (
        <img
          {...rest}
          src={resolved}
          alt={alt && alt !== 'Imgur' ? alt : fallbackAlt}
          data-source-src={ref}
          loading="lazy"
          decoding="async"
        />
      )
    },
    pre({ children }) {
      const c = codeFromPre(children)
      return c ? <CodeBlock {...c} /> : <pre>{children}</pre>
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto">
          <table>{children}</table>
        </div>
      )
    },
  }
}

export function PrimerMarkdown({ markdown, docPath }: { markdown: string; docPath: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkGemoji]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
      components={components(docPath)}
    >
      {normalizeInlineHtml(markdown)}
    </Markdown>
  )
}
