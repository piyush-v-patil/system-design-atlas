/**
 * Independent extraction from ./source for the coverage test. Deliberately does not reuse the pipeline's
 * section splitter: it walks the full markdown AST (headings at any depth, links, images, raw HTML, code).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { fromHtml } from 'hast-util-from-html'
import type { Element } from 'hast'

export const SOURCE = join(import.meta.dirname, '../../source')
export const read = (p: string) => readFileSync(join(SOURCE, p), 'utf8')

export interface SourceHeading {
  file: string
  line: number
  depth: number
  title: string
  slug: string
}

export type UrlContext = 'link' | 'image' | 'html' | 'text'
export interface SourceUrl {
  file: string
  line: number
  url: string
  context: UrlContext
}

const parse = (md: string) => unified().use(remarkParse).use(remarkGfm).parse(md)
const BARE_URL = /https?:\/\/[^\s<>"'`)\]]+/g

export function headingsOf(file: string, md: string): SourceHeading[] {
  const slugger = new GithubSlugger()
  const out: SourceHeading[] = []
  visit(parse(md), 'heading', (h) => {
    const title = toString(h)
    out.push({ file, line: h.position!.start.line, depth: h.depth, title, slug: slugger.slug(title) })
  })
  return out
}

/** Raw HTML attributes anywhere in the text, quoted or not (independent of how the markdown parser sees them). */
const HTML_ATTR = /<(a|img)\b[^>]*?\b(href|src)=("[^"]*"|'[^']*'|[^\s>]+)/gi

export function urlsOf(file: string, md: string): SourceUrl[] {
  const out: SourceUrl[] = []
  const lineOf = (offset: number) => md.slice(0, offset).split('\n').length
  for (const m of md.matchAll(HTML_ATTR))
    out.push({ file, line: lineOf(m.index!), url: m[3].replace(/^["']|["']$/g, ''), context: m[1].toLowerCase() === 'img' ? 'image' : 'html' })
  visit(parse(md), (node, index, parent) => {
    const line = node.position?.start.line ?? 0
    // GFM autolinks a bare URL that directly follows `href=` (an unquoted inline HTML attribute): already counted above.
    const prev = parent && typeof index === 'number' ? (parent.children[index - 1] as { type: string; value?: string } | undefined) : undefined
    if (node.type === 'link' && prev?.type === 'text' && prev.value?.endsWith('href=')) return
    if (node.type === 'link' || node.type === 'definition') out.push({ file, line, url: (node as { url: string }).url, context: 'link' })
    else if (node.type === 'image') out.push({ file, line, url: (node as { url: string }).url, context: 'image' })
    else if (node.type === 'html') {
      visit(fromHtml((node as { value: string }).value, { fragment: true }), 'element', (el: Element) => {
        const p = el.properties ?? {}
        if (typeof p.href === 'string') out.push({ file, line, url: p.href, context: 'html' })
        if (typeof p.src === 'string') out.push({ file, line, url: p.src, context: el.tagName === 'img' ? 'image' : 'html' })
      })
    } else if (node.type === 'text' && /href=$/.test((node as { value: string }).value)) {
      // handled by HTML_ATTR
    } else if (node.type === 'code' || node.type === 'inlineCode') {
      for (const m of (node as { value: string }).value.matchAll(BARE_URL)) out.push({ file, line, url: m[0], context: 'text' })
    }
  })
  return out
}

export function solutionDirs(): string[] {
  return readdirSync(join(SOURCE, 'solutions/system_design')).filter((d) =>
    existsSync(join(SOURCE, 'solutions/system_design', d, 'README.md')),
  )
}

export function notebooks(): { dir: string; path: string; cells: { type: string; source: string }[] }[] {
  const root = 'solutions/object_oriented_design'
  return readdirSync(join(SOURCE, root)).flatMap((dir) =>
    readdirSync(join(SOURCE, root, dir))
      .filter((f) => f.endsWith('.ipynb'))
      .map((f) => {
        const nb = JSON.parse(read(`${root}/${dir}/${f}`)) as { cells: { cell_type: string; source: string | string[] }[] }
        return {
          dir,
          path: `${root}/${dir}/${f}`,
          cells: nb.cells.map((c) => ({ type: c.cell_type, source: Array.isArray(c.source) ? c.source.join('') : c.source })),
        }
      }),
  )
}

/** URLs inside a notebook: markdown cells parsed as markdown; code cells scanned for bare URLs. */
export function notebookUrls(nb: ReturnType<typeof notebooks>[number]): SourceUrl[] {
  return nb.cells.flatMap((c) =>
    c.type === 'markdown'
      ? urlsOf(nb.path, c.source)
      : [...c.source.matchAll(BARE_URL)].map((m) => ({ file: nb.path, line: 0, url: m[0], context: 'text' as const })),
  )
}
