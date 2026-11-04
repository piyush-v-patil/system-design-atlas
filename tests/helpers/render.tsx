import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { fromHtml } from 'hast-util-from-html'
import { visit } from 'unist-util-visit'
import type { Element, Text } from 'hast'
import { AppRoutes, type Pages } from '../../src/app/App.tsx'
import { HomePage } from '../../src/pages/HomePage.tsx'
import { MapPage } from '../../src/pages/MapPage.tsx'
import { TopicPage } from '../../src/topic/TopicPage.tsx'
import { SolutionPage } from '../../src/pages/SolutionPage.tsx'
import { OodPage } from '../../src/pages/OodPage.tsx'
import { ProblemsPage } from '../../src/pages/ProblemsPage.tsx'
import { PathPage } from '../../src/pages/PathPage.tsx'

/** The real pages, loaded up front (the app loads them lazily). */
const PAGES: Pages = { HomePage, MapPage, TopicPage, SolutionPage, OodPage, ProblemsPage, PathPage }

export function renderRoute(path: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes pages={PAGES} />
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
