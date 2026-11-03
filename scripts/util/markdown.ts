import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { fromHtml } from 'hast-util-from-html'
import type { Root, Heading, Html } from 'mdast'
import type { Element } from 'hast'
import type { SectionDocument, SectionNode, SourceRef } from '../../src/lib/types.ts'
import { normalizeInlineHtml } from '../../src/lib/markdown-fixups.ts'

export function parseMarkdown(src: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(src)
}

/** Line number (1-based) for a character offset. */
function lineAt(src: string, offset: number): number {
  let line = 1
  for (let i = 0; i < offset && i < src.length; i++) if (src.charCodeAt(i) === 10) line++
  return line
}

/** href/src attributes inside a raw HTML snippet (handles unquoted attributes like href=http://…). */
export function htmlAttrs(html: string): { hrefs: string[]; srcs: string[]; elements: Element[] } {
  const tree = fromHtml(html, { fragment: true })
  const hrefs: string[] = []
  const srcs: string[] = []
  const elements: Element[] = []
  visit(tree, 'element', (el: Element) => {
    elements.push(el)
    const p = el.properties ?? {}
    if (typeof p.href === 'string') hrefs.push(p.href)
    if (typeof p.src === 'string') srcs.push(p.src)
  })
  return { hrefs, srcs, elements }
}

/** Link and image targets in a markdown fragment, in order of appearance (deduplicated). */
export function extractRefs(fragment: string): { urls: string[]; images: string[] } {
  const tree = parseMarkdown(normalizeInlineHtml(fragment))
  const urls: string[] = []
  const images: string[] = []
  visit(tree, (node) => {
    if (node.type === 'link' || node.type === 'definition') urls.push((node as { url: string }).url)
    else if (node.type === 'image') {
      const url = (node as { url: string }).url
      urls.push(url)
      images.push(url)
    } else if (node.type === 'html') {
      const { hrefs, srcs } = htmlAttrs((node as Html).value)
      urls.push(...hrefs, ...srcs)
      images.push(...srcs)
    }
  })
  return { urls: [...new Set(urls)], images: [...new Set(images)] }
}

/**
 * Split a markdown document into one node per heading. Each node holds the raw source slice from the end
 * of its heading to the start of the next heading, so preamble + Σ(heading + body) reproduces the input
 * byte-for-byte. Ids are GitHub-compatible slugs, so the Primer's own #anchors resolve unchanged.
 */
export function splitSections(src: string, source: SourceRef): SectionDocument<SectionNode> {
  const tree = parseMarkdown(src)
  const headings = tree.children.filter((n): n is Heading => n.type === 'heading')
  if (headings.length === 0) throw new Error(`${source.path}: no headings`)
  const slugger = new GithubSlugger()
  const nodes: Record<string, SectionNode> = {}
  const order: string[] = []
  const stack: SectionNode[] = []

  headings.forEach((h, i) => {
    const start = h.position!.start.offset!
    const end = h.position!.end.offset!
    const nextStart = i + 1 < headings.length ? headings[i + 1].position!.start.offset! : src.length
    const title = toString(h)
    const id = slugger.slug(title)
    const markdown = src.slice(end, nextStart)

    while (stack.length && stack[stack.length - 1].depth >= h.depth) stack.pop()
    const parent = stack[stack.length - 1] ?? null
    if (!parent && order.length > 0) throw new Error(`${source.path}: more than one root heading ("${title}")`)

    const refs = extractRefs(markdown)
    const endLine = lineAt(src, Math.max(start, nextStart - 1))
    const node: SectionNode = {
      id,
      title,
      depth: h.depth,
      level: parent ? parent.level + 1 : 0,
      order: i,
      parentId: parent?.id ?? null,
      childIds: [],
      headingPath: [...(parent?.headingPath ?? []), title],
      pathIds: [...(parent?.pathIds ?? []), id],
      headingMarkdown: src.slice(start, end),
      markdown,
      sourceLines: [h.position!.start.line, endLine],
      urls: refs.urls,
      images: refs.images,
    }
    if (parent) parent.childIds.push(id)
    nodes[id] = node
    order.push(id)
    stack.push(node)
  })

  return {
    source,
    preamble: src.slice(0, headings[0].position!.start.offset!),
    rootId: order[0],
    order,
    nodes,
  }
}

/** Inverse of splitSections; used by the lossless test. */
export function joinSections(doc: SectionDocument): string {
  return doc.preamble + doc.order.map((id) => doc.nodes[id].headingMarkdown + doc.nodes[id].markdown).join('')
}
