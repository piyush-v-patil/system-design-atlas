/**
 * Coverage test: proves nothing from the Primer was lost on the way into the Atlas.
 *
 *  1. every README heading maps to a topic node that is reachable from the map
 *  2. every URL in README.md, the solutions and the OOD notebooks appears in the rendered app
 *  3. every image referenced in the source is rendered (with its file present and its credit shown)
 *  4. every system design solution and OOD problem has a page
 *
 * Sources are re-parsed independently (tests/helpers/source.ts) and checked against server-rendered HTML of every
 * route (tests/helpers/render.tsx). Anything missing is printed as a list before the assertions fail.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { topics, solutions, oods, images } from '../src/lib/content.ts'
import { buildMapTree, type MapDatum } from '../src/map/mapData.ts'
import { inspect, type RenderedPage } from './helpers/render.tsx'
import { builders } from '../content/builders/index.ts'
import { headingsOf, notebooks, notebookUrls, read, solutionDirs, urlsOf, type SourceUrl } from './helpers/source.ts'

const PUBLIC = join(import.meta.dirname, '../public')
const CHECKS = 5
const report: Record<string, { checked: number; missing: string[] }> = {}
const record = (check: string, checked: number, missing: string[]) => (report[check] = { checked, missing })

const pages = new Map<string, RenderedPage>()
const page = (path: string) => {
  if (!pages.has(path)) pages.set(path, inspect(path))
  return pages.get(path)!
}
const solutionRoutes = (id: string) => Array.from({ length: builders[id].frames.length + 1 }, (_, f) => (f ? `/solutions/${id}?f=${f}` : `/solutions/${id}`))
/** All steps of a solution, as one page. */
const solutionPage = (id: string) => {
  const ps = solutionRoutes(id).map(page)
  return { text: ps.map((p) => p.text).join('\n'), html: ps.map((p) => p.html).join('\n') }
}
let allAttrs = new Set<string>()
let allText = ''

beforeAll(() => {
  const routes = [
    '/',
    '/problems',
    ...topics.order.map((id) => `/topic/${id}`),
    // A solution shows one interview step at a time: every step (?f=…) is a page of its own.
    ...solutions.flatMap((s) => solutionRoutes(s.id)),
    // An OOD problem opens on its class diagram; the notebook and module are tabs (?view=…).
    ...oods.flatMap((o) => [`/ood/${o.id}`, `/ood/${o.id}?view=notebook`, `/ood/${o.id}?view=module`]),
  ]
  for (const r of routes) page(r)
  allAttrs = new Set([...pages.values()].flatMap((p) => [...p.attrs]))
  allText = [...pages.values()].map((p) => p.text).join('\n')
}, 180_000)

afterAll(() => {
  const lines = ['', '──────── Coverage report ────────']
  for (const [check, { checked, missing }] of Object.entries(report)) {
    lines.push(`${missing.length === 0 ? '✔' : '✘'} ${check}: ${checked - missing.length}/${checked}`)
    for (const m of missing) lines.push(`    missing: ${m}`)
  }
  const total = Object.values(report).reduce((n, r) => n + r.missing.length, 0)
  const ran = Object.keys(report).length
  if (ran < CHECKS) lines.push(`⚠ Only ${ran}/${CHECKS} checks ran: coverage is NOT proven.`)
  else lines.push(total === 0 ? 'Nothing missing.' : `${total} item(s) missing.`)
  lines.push('')
  process.stdout.write(lines.join('\n') + '\n')
})

describe('coverage', () => {
  it('every README heading maps to a topic node reachable from the map', () => {
    const headings = headingsOf('README.md', read('README.md'))
    const reachable = new Set<string>()
    const walk = (d: MapDatum) => (reachable.add(d.id), d.children?.forEach(walk))
    walk(buildMapTree(topics))
    const mapPage = page('/')

    const missing: string[] = []
    for (const h of headings) {
      const where = `README.md:${h.line} "${'#'.repeat(h.depth)} ${h.title}"`
      const node = topics.nodes[h.slug]
      if (!node) missing.push(`${where} → no topic node "${h.slug}"`)
      else if (node.title !== h.title) missing.push(`${where} → node title "${node.title}"`)
      else if (!reachable.has(h.slug)) missing.push(`${where} → not in the map tree`)
      // Focus view (default): the root is on the home map; every other heading is drawn when its parent is focused,
      // i.e. it is one click away from its parent on the map.
      else if (!(node.parentId ? page(`/topic/${node.parentId}`) : mapPage).mapNodeIds.has(h.slug))
        missing.push(`${where} → not drawn on the map when its parent is focused`)
      else {
        const card = page(`/topic/${h.slug}`)
        if (!card.html.includes(`data-topic-id="${h.slug}"`) || !card.text.includes(h.title))
          missing.push(`${where} → card does not render`)
      }
    }
    if (topics.order.length !== headings.length)
      missing.push(`topic count ${topics.order.length} ≠ heading count ${headings.length}`)
    record('README headings → map nodes → cards', headings.length, missing)
    expect(missing).toEqual([])
  })

  it('every solution heading is rendered on its solution page (across its steps)', () => {
    const missing: string[] = []
    let checked = 0
    for (const dir of solutionDirs()) {
      const path = `solutions/system_design/${dir}/README.md`
      const sol = solutions.find((s) => s.dir === dir)
      const hs = headingsOf(path, read(path))
      checked += hs.length
      if (!sol) {
        missing.push(`${path} → no solution data`)
        continue
      }
      const p = solutionPage(sol.id)
      for (const h of hs)
        if (!sol.nodes[h.slug] || !p.text.includes(h.title) || (h.depth > 1 && !p.html.includes(`data-section-id="${h.slug}"`)))
          missing.push(`${path}:${h.line} "${h.title}"`)
    }
    record('Solution headings → solution pages', checked, missing)
    expect(missing).toEqual([])
  })

  it('every URL in README.md, the solutions and the notebooks appears in the app', () => {
    const urls: SourceUrl[] = [
      ...urlsOf('README.md', read('README.md')),
      ...solutionDirs().flatMap((d) => {
        const p = `solutions/system_design/${d}/README.md`
        return urlsOf(p, read(p))
      }),
      ...notebooks().flatMap(notebookUrls),
    ]
    const missing: string[] = []
    const seen = new Set<string>()
    for (const u of urls) {
      const key = `${u.context}|${u.url}`
      if (seen.has(key)) continue
      seen.add(key)
      // Links and images must survive as an attribute (href/src or the data-source-* original of a rewritten link);
      // URLs that only appear as text (e.g. inside code blocks) must appear in the rendered text.
      const ok = u.context === 'text' ? allText.includes(u.url) : allAttrs.has(u.url)
      if (!ok) missing.push(`${u.file}:${u.line} [${u.context}] ${u.url}`)
    }
    const unique = new Set(urls.map((u) => u.url)).size
    record(`URLs (${unique} unique, ${urls.length} occurrences)`, seen.size, missing)
    expect(missing).toEqual([])
  })

  it('every image referenced in the source is rendered', () => {
    const refs: SourceUrl[] = [
      ...urlsOf('README.md', read('README.md')),
      ...solutionDirs().flatMap((d) => {
        const p = `solutions/system_design/${d}/README.md`
        return urlsOf(p, read(p))
      }),
      ...notebooks().flatMap(notebookUrls),
    ].filter((u) => u.context === 'image')
    const missing: string[] = []
    const checked = new Set<string>()
    for (const r of refs) {
      if (checked.has(r.url)) continue
      checked.add(r.url)
      const where = `${r.file}:${r.line} ${r.url}`
      const entry = images.entries[r.url]
      if (!entry) {
        missing.push(`${where} → not in content/images.json`)
        continue
      }
      if (!existsSync(join(PUBLIC, entry.src))) {
        missing.push(`${where} → file public/${entry.src} missing`)
        continue
      }
      const shown = [...pages.values()].filter((p) => p.imgs.some((i) => i.sourceSrc === r.url && i.src.endsWith(entry.src)))
      if (shown.length === 0) missing.push(`${where} → never rendered as <img>`)
      else if (entry.credit && !shown.some((p) => p.text.includes(entry.credit!.text) && p.attrs.has(entry.credit!.url)))
        missing.push(`${where} → rendered without its credit "${entry.credit.text}"`)
    }
    record('Images (rendered, file present, credit shown)', checked.size, missing)
    expect(missing).toEqual([])
  })

  it('every solution and OOD problem has a page', () => {
    const missing: string[] = []
    const dirs = solutionDirs()
    for (const dir of dirs) {
      const sol = solutions.find((s) => s.dir === dir)
      if (!sol || !page(`/solutions/${sol.id}`).html.includes(`data-solution-id="${sol.id}"`))
        missing.push(`solutions/system_design/${dir}`)
    }
    const nbs = notebooks()
    for (const nb of nbs) {
      const ood = oods.find((o) => o.source.path === nb.path)
      if (!ood || !page(`/ood/${ood.id}`).html.includes(`data-ood-id="${ood.id}"`)) missing.push(nb.path)
    }
    // The README's tables must link to those pages.
    const readmeLinks = [...read('README.md').matchAll(/\]\((solutions\/[^)]+\.(?:md|ipynb))\)/g)].map((m) => m[1])
    for (const l of new Set(readmeLinks)) if (!allAttrs.has(l)) missing.push(`README link ${l} not rendered`)
    record('Solution + OOD pages', dirs.length + nbs.length, missing)
    expect(dirs.length).toBe(8)
    expect(nbs.length).toBe(6)
    expect(missing).toEqual([])
  })
})
