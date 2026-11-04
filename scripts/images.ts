import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ImageEntry, ImagesFile, SectionDocument } from '../src/lib/types.ts'
import { htmlAttrs, parseMarkdown } from './util/markdown.ts'
import { visit } from 'unist-util-visit'
import { toString } from 'hast-util-to-string'
import type { Html } from 'mdast'

/**
 * Solution READMEs embed diagrams from imgur. Each was matched to the copy shipped in the Primer repo by
 * downloading the imgur original and comparing dimensions and content (docs/PLAN.md §6).
 * The local copies differ only in metadata bytes, except BKsBnmG whose padding differs (same drawing).
 */
export const IMGUR_TO_LOCAL: Record<string, string> = {
  // Step 2 (high level) diagrams
  BKsBnmG: 'pastebin/pastebin_basic.png',
  '48tEA2j': 'twitter/twitter_basic.png',
  xjdAAUv: 'web_crawler/web_crawler_basic.png',
  E8klrBh: 'mint/mint_basic.png',
  wxXyq2J: 'social_graph/social_graph_basic.png',
  KqZ3dSx: 'query_cache/query_cache_basic.png',
  vwMa1Qu: 'sales_rank/sales_rank_basic.png',
  // Step 4 (scaled) diagrams
  '4edXG0T': 'pastebin/pastebin.png',
  jrUBAF7: 'twitter/twitter.png',
  bWxPtQA: 'web_crawler/web_crawler.png',
  V5q57vU: 'mint/mint.png',
  cdCv5g7: 'social_graph/social_graph.png',
  '4j99mhe': 'query_cache/query_cache.png',
  MzExP06: 'sales_rank/sales_rank.png',
  // scaling_aws: Step 2, then Users+ … Users+++++
  B8LDKD7: 'scaling_aws/scaling_aws_1.png',
  rrfjMXB: 'scaling_aws/scaling_aws_2.png',
  raoFTXM: 'scaling_aws/scaling_aws_3.png',
  OZCxJr0: 'scaling_aws/scaling_aws_4.png',
  '3X8nmdL': 'scaling_aws/scaling_aws_5.png',
  jj3A5N8: 'scaling_aws/scaling_aws_7.png',
}

/** README's "Latency numbers visualized" uses a camo proxy for http://i.imgur.com/k0t1e.png; vendored once. */
export const REMOTE_IMAGES: Record<string, { file: string; from: string }> = {
  'https://camo.githubusercontent.com/77f72259e1eb58596b564d1ad823af1853bc60a3/687474703a2f2f692e696d6775722e636f6d2f6b307431652e706e67':
    { file: 'remote/k0t1e.png', from: 'https://i.imgur.com/k0t1e.png' },
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile())
}

export async function copyImages(sourceRoot: string, publicDir: string): Promise<string[]> {
  const out = join(publicDir, 'images')
  // Clear everything except vendored remote images.
  if (existsSync(out)) for (const f of readdirSync(out)) if (f !== 'remote') rmSync(join(out, f), { recursive: true })
  mkdirSync(out, { recursive: true })
  const copied: string[] = []

  for (const f of listFiles(join(sourceRoot, 'images'))) {
    copyFileSync(join(sourceRoot, 'images', f), join(out, f))
    copied.push(`images/${f}`)
  }
  const solRoot = join(sourceRoot, 'solutions/system_design')
  for (const dir of readdirSync(solRoot)) {
    if (!statSync(join(solRoot, dir)).isDirectory()) continue
    for (const f of listFiles(join(solRoot, dir)).filter((f) => /\.(png|jpe?g|gif|svg)$/i.test(f))) {
      mkdirSync(join(out, 'solutions', dir), { recursive: true })
      copyFileSync(join(solRoot, dir, f), join(out, 'solutions', dir, f))
      copied.push(`images/solutions/${dir}/${f}`)
    }
  }
  for (const { file, from } of Object.values(REMOTE_IMAGES)) {
    const dest = join(out, file)
    if (!existsSync(dest)) {
      const res = await fetch(from)
      if (!res.ok) throw new Error(`Could not vendor ${from}: HTTP ${res.status}. Commit public/images/${file}.`)
      mkdirSync(join(out, 'remote'), { recursive: true })
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    }
  }
  return copied
}

export function resolveImage(ref: string): Pick<ImageEntry, 'src' | 'origin' | 'vendoredFrom'> {
  if (REMOTE_IMAGES[ref]) return { src: `images/${REMOTE_IMAGES[ref].file}`, origin: 'remote', vendoredFrom: REMOTE_IMAGES[ref].from }
  const imgur = /^https?:\/\/i\.imgur\.com\/([A-Za-z0-9]+)\.(png|jpe?g|gif)$/.exec(ref)
  if (imgur) {
    const local = IMGUR_TO_LOCAL[imgur[1]]
    if (!local) throw new Error(`No local copy mapped for imgur image ${ref}`)
    return { src: `images/solutions/${local}`, origin: 'solution-folder' }
  }
  if (/^images\/[^/]+$/.test(ref)) return { src: ref, origin: 'primer-images' }
  throw new Error(`Unrecognised image reference: ${ref}`)
}

/** Caption and "Source: …" credit from the raw HTML block that contains an image. */
function creditsFromHtml(html: string): Map<string, { caption: string | null; credit: ImageEntry['credit'] }> {
  const map = new Map<string, { caption: string | null; credit: ImageEntry['credit'] }>()
  const { srcs, elements } = htmlAttrs(html)
  if (srcs.length === 0) return map
  const italic = elements.find((e) => e.tagName === 'i')
  const link = italic && elements.find((e) => e.tagName === 'a' && typeof e.properties?.href === 'string')
  const caption = italic ? toString(italic).trim() : null
  const credit = link ? { text: toString(link).trim(), url: String(link.properties!.href) } : null
  for (const s of srcs) map.set(s, { caption, credit })
  return map
}

export function buildImageManifest(docs: { path: string; markdown: string }[], copied: string[], publicDir: string): ImagesFile {
  const entries: Record<string, ImageEntry> = {}
  for (const doc of docs) {
    const tree = parseMarkdown(doc.markdown)
    const found: { ref: string; caption: string | null; credit: ImageEntry['credit'] }[] = []
    visit(tree, (node) => {
      if (node.type === 'image') found.push({ ref: (node as { url: string }).url, caption: null, credit: null })
      if (node.type === 'html')
        for (const [ref, c] of creditsFromHtml((node as Html).value)) found.push({ ref, ...c })
    })
    for (const f of found) {
      const existing = entries[f.ref]
      if (existing) {
        if (!existing.referencedIn.includes(doc.path)) existing.referencedIn.push(doc.path)
        existing.caption ??= f.caption
        existing.credit ??= f.credit
        continue
      }
      const resolved = resolveImage(f.ref)
      if (!existsSync(join(publicDir, resolved.src))) throw new Error(`Image ${f.ref} → ${resolved.src} is missing`)
      entries[f.ref] = { ref: f.ref, ...resolved, referencedIn: [doc.path], caption: f.caption, credit: f.credit }
    }
  }
  const used = new Set(Object.values(entries).map((e) => e.src))
  return { entries, unreferenced: copied.filter((c) => !used.has(c)).sort() }
}

export function docMarkdown(doc: SectionDocument): string {
  return doc.preamble + doc.order.map((id) => doc.nodes[id].headingMarkdown + doc.nodes[id].markdown).join('')
}
