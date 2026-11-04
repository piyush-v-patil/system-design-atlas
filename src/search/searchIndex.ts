import { GLOSSARY } from '../../content/glossary.ts'
import { sourceText, topics } from '../lib/content.ts'
import { oods, solutions } from '../lib/problems.ts'
import { stripHiddenImages } from '../lib/hiddenImages.ts'
import { plain } from '../lib/quote.ts'

export type ResultKind = 'topic' | 'problem' | 'ood' | 'term'

export interface SearchEntry {
  kind: ResultKind
  key: string
  title: string
  /** Where it sits, e.g. "Database › SQL tuning". */
  where: string
  /** Searchable body text (plain, lower-cased copy kept separately). */
  text: string
  to: string
  /** Lower-cased title and text, precomputed. */
  t: string
  b: string
}

export interface SearchResult {
  entry: SearchEntry
  score: number
  /** A short piece of the text around the first match, when the match is in the body. */
  snippet?: string
}

const clean = (md: string) =>
  plain(
    stripHiddenImages(md)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/^#{1,6}[ \t]*/gm, '')
      .replace(/^[ \t]*>[ \t]?/gm, '')
      .replace(/^\|?[\s:|-]+\|?$/gm, ' ')
      .replace(/\|/g, ' '),
  )

let cache: SearchEntry[] | null = null

/** Everything the reader can open: topics, the problems, the OOD problems and the explained terms. */
export function searchIndex(): SearchEntry[] {
  if (cache) return cache
  const out: SearchEntry[] = []
  const add = (e: Omit<SearchEntry, 't' | 'b'>) => out.push({ ...e, t: e.title.toLowerCase(), b: e.text.toLowerCase() })

  for (const id of topics.order) {
    const n = topics.nodes[id]
    // Short attached sections (sources, disadvantages) open on their topic's page, scrolled to the section.
    const to = `/topic/${id}`
    const where = n.pathIds
      .slice(1, -1)
      .map((p) => topics.nodes[p].title)
      .join(' › ')
    add({ kind: 'topic', key: `t:${id}`, title: n.kind !== 'topic' && n.parentId ? `${n.title} · ${topics.nodes[n.parentId].title}` : n.title, where, text: clean(n.markdown), to })
  }
  for (const s of solutions)
    add({ kind: 'problem', key: `s:${s.id}`, title: s.readmeTitle, where: 'System design problem', text: clean(sourceText(s)), to: `/solutions/${s.id}` })
  for (const o of oods)
    add({ kind: 'ood', key: `o:${o.id}`, title: o.readmeTitle, where: 'Object-oriented design problem', text: clean(o.cells.map((c) => c.source).join('\n')), to: `/ood/${o.id}` })

  // A term opens the first topic that links it.
  for (const [url, g] of Object.entries(GLOSSARY)) {
    const home = topics.order.find((id) => topics.nodes[id].markdown.includes(`](${url})`))
    const sol = home ? undefined : solutions.find((s) => sourceText(s).includes(`](${url})`))
    const to = home ? `/topic/${home}` : sol ? `/solutions/${sol.id}` : null
    if (!to) continue
    const where = home ? `Term · in ${topics.nodes[home].title}` : `Term · in ${sol!.readmeTitle}`
    add({ kind: 'term', key: `g:${url}`, title: g.term, where, text: g.text.join(' '), to })
  }
  cache = out
  return out
}

const wordStart = (hay: string, needle: string) => {
  let i = hay.indexOf(needle)
  while (i >= 0) {
    if (i === 0 || !/[a-z0-9]/.test(hay[i - 1])) return i
    i = hay.indexOf(needle, i + 1)
  }
  return -1
}

/**
 * Every word of the query must appear (as the start of a word) in the title or the text. Title matches count far
 * more than text matches; an exact or leading title match ranks first.
 */
export function search(query: string, limit = 30): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const words = q.split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []
  for (const e of searchIndex()) {
    let score = 0
    let firstBody = -1
    let ok = true
    for (const w of words) {
      const inTitle = wordStart(e.t, w)
      const inBody = inTitle >= 0 ? -1 : wordStart(e.b, w)
      if (inTitle < 0 && inBody < 0) {
        ok = false
        break
      }
      if (inTitle >= 0) score += inTitle === 0 ? 40 : 25
      else {
        score += 4
        if (firstBody < 0) firstBody = inBody
      }
    }
    if (!ok) continue
    if (e.t === q) score += 100
    else if (e.t.startsWith(q)) score += 50
    if (e.kind === 'topic' && !e.title.includes('·')) score += 3
    if (e.kind === 'term') score += 2
    let snippet: string | undefined
    if (firstBody >= 0) {
      const a = Math.max(0, firstBody - 60)
      snippet = (a > 0 ? '…' : '') + e.text.slice(a, firstBody + 110).trim() + (firstBody + 110 < e.text.length ? '…' : '')
    }
    results.push({ entry: e, score, snippet })
  }
  return results.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length).slice(0, limit)
}
