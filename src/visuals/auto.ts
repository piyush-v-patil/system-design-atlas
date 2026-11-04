/**
 * Visual content derived mechanically from a node's own markdown, so it is verbatim by construction:
 * bullet lists become claims (with their exact source line), links become reading cards, tables become rows.
 */
import { q, type Claim } from '../../content/visuals/types.ts'
import type { TopicNode } from '../lib/types.ts'
import { plain } from '../lib/quote.ts'

/** Line number in README of line `i` of node.markdown (markdown starts on the heading's line). */
const lineOf = (n: TopicNode, i: number) => n.sourceLines[0] + i

export interface Bullet {
  depth: number
  /** Raw markdown of the bullet text (for rendering links). */
  md: string
  claim: Claim
}

export function bullets(n: TopicNode): Bullet[] {
  const out: Bullet[] = []
  n.markdown.split('\n').forEach((l, i) => {
    const m = /^(\s*)[*-]\s+(.*)$/.exec(l)
    if (!m || !m[2].trim()) return
    out.push({ depth: Math.floor(m[1].length / 4), md: m[2], claim: q(plain(m[2]), lineOf(n, i)) })
  })
  return out
}

/** Paragraph sentences (non-bullet, non-HTML, non-code lines), as quoted claims. */
export function paragraphs(n: TopicNode): Claim[] {
  const out: Claim[] = []
  let inCode = false
  n.markdown.split('\n').forEach((l, i) => {
    if (/^```/.test(l)) inCode = !inCode
    if (inCode || !l.trim() || /^\s*([*-]\s|<|\||>|!\[|```)/.test(l) || /^\s{4}/.test(l)) return
    out.push(q(plain(l), lineOf(n, i)))
  })
  return out
}

export interface LinkItem {
  title: string
  url: string
  /** Text after the link on the same bullet, if any. */
  note: string
  line: number
}

export function links(n: TopicNode): LinkItem[] {
  const out: LinkItem[] = []
  n.markdown.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/\[([^\]]+)\]\(((?:[^()\s]|\([^)]*\))+)\)/g)) {
      const rest = l.slice((m.index ?? 0) + m[0].length).replace(/^[\s:,-]+/, '')
      out.push({ title: plain(m[1]), url: m[2], note: plain(rest), line: lineOf(n, i) })
    }
  })
  return out
}

export interface TableData {
  header: string[]
  rows: { cells: string[]; line: number }[]
}

/** The first markdown table in a node, cells kept as raw markdown. Blank separator rows are dropped. */
export function table(n: TopicNode): TableData | null {
  const lines = n.markdown.split('\n')
  const start = lines.findIndex((l, i) => /^\s*\|/.test(l) && /^\s*\|?\s*-{3}/.test(lines[i + 1] ?? ''))
  if (start < 0) return null
  const split = (l: string) => {
    const cells = l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    return cells
  }
  const header = split(lines[start])
  const rows: TableData['rows'] = []
  for (let i = start + 2; i < lines.length && /^\s*\|/.test(lines[i]); i++) {
    const cells = split(lines[i])
    if (cells.every((c) => c === '')) continue
    rows.push({ cells, line: lineOf(n, i) })
  }
  return { header, rows }
}

/** What kind of resource a URL points at, for a small icon/label. */
export function resourceKind(url: string): { label: string; icon: string } {
  const u = url.toLowerCase()
  if (u.includes('web.archive.org')) return { label: 'Archived page', icon: '🗄' }
  if (/youtube\.com|youtu\.be/.test(u)) return { label: 'Video', icon: '▶' }
  if (u.endsWith('.pdf')) return { label: 'PDF', icon: '📄' }
  if (u.includes('slideshare.net')) return { label: 'Slides', icon: '🖼' }
  if (u.includes('wikipedia.org')) return { label: 'Wikipedia', icon: 'W' }
  if (u.includes('github.com') || u.includes('gist.github')) return { label: 'GitHub', icon: '⌥' }
  if (/stackoverflow|stackexchange|quora/.test(u)) return { label: 'Q&A', icon: '?' }
  return { label: 'Article', icon: '↗' }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** The bullet list that directly follows the line containing `marker` (e.g. "Reasons for **SQL**"). */
export function bulletsAfter(n: TopicNode, marker: string): Bullet[] {
  const lines = n.markdown.split('\n')
  const start = lines.findIndex((l) => l.includes(marker))
  if (start < 0) return []
  const out: Bullet[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(\s*)[*-]\s+(.*)$/.exec(lines[i])
    if (m) out.push({ depth: Math.floor(m[1].length / 4), md: m[2], claim: q(plain(m[2]), lineOf(n, i)) })
    else if (lines[i].trim() === '' && out.length === 0) continue
    else break
  }
  return out
}
