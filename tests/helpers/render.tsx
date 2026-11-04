import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { fromHtml } from 'hast-util-from-html'
import { visit } from 'unist-util-visit'
import type { Element, Text } from 'hast'
import { AppRoutes } from '../../src/app/App.tsx'

export function renderRoute(path: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

export interface RenderedPage {
  path: string
  html: string
  /** Every href / src / data-source-href / data-source-src value (entity-decoded). */
  attrs: Set<string>
  /** All text content, concatenated. */
  text: string
  imgs: { src: string; sourceSrc: string | undefined }[]
  /** data-node-id values rendered by the map. */
  mapNodeIds: Set<string>
}

export function inspect(path: string): RenderedPage {
  const html = renderRoute(path)
  const tree = fromHtml(html, { fragment: true })
  const attrs = new Set<string>()
  const imgs: RenderedPage['imgs'] = []
  const mapNodeIds = new Set<string>()
  const text: string[] = []
  visit(tree, (node) => {
    if (node.type === 'text') text.push((node as Text).value)
    if (node.type !== 'element') return
    const p = (node as Element).properties ?? {}
    for (const key of ['href', 'src', 'dataSourceHref', 'dataSourceSrc'])
      if (typeof p[key] === 'string') attrs.add(p[key] as string)
    if ((node as Element).tagName === 'img')
      imgs.push({ src: String(p.src), sourceSrc: typeof p.dataSourceSrc === 'string' ? p.dataSourceSrc : undefined })
    if (typeof p.dataNodeId === 'string') mapNodeIds.add(p.dataNodeId)
  })
  return { path, html, attrs, text: text.join(' '), imgs, mapNodeIds }
}
