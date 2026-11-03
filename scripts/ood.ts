import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NotebookCell, OodFile, SourceRef } from '../src/lib/types.ts'
import { extractRefs } from './util/markdown.ts'

interface RawCell {
  cell_type: 'markdown' | 'code' | 'raw'
  source: string | string[]
  outputs?: { output_type: string; text?: string | string[]; data?: Record<string, string | string[]> }[]
}

const join_ = (s: string | string[] | undefined) => (Array.isArray(s) ? s.join('') : (s ?? ''))

export function oodIdFromDir(dir: string): string {
  return dir.replace(/_/g, '-')
}

/** README table rows: "| Design a hash map | [Solution](solutions/object_oriented_design/hash_table/hash_map.ipynb)  |" */
export function readmeOodTitles(readme: string): Map<string, { title: string; notebook: string }> {
  const map = new Map<string, { title: string; notebook: string }>()
  const re = /^\|\s*([^|]+?)\s*\|\s*\[Solution\]\((solutions\/object_oriented_design\/([^/]+)\/[^)]+\.ipynb)\)/gm
  for (const m of readme.matchAll(re)) map.set(m[3], { title: m[1], notebook: m[2] })
  return map
}

export function notebookToMarkdown(cells: NotebookCell[]): string {
  return cells
    .map((c) => {
      if (c.cellType === 'markdown') return c.source
      if (c.cellType === 'raw') return '```\n' + c.source + '\n```'
      const out = c.outputs.map((o) => '\n\n*Output:*\n\n```text\n' + o.replace(/\n$/, '') + '\n```').join('')
      return '```python\n' + c.source + '\n```' + out
    })
    .join('\n\n')
}

export function buildOod(
  sourceRoot: string,
  dir: string,
  base: Omit<SourceRef, 'path'>,
  readmeTitles: Map<string, { title: string; notebook: string }>,
): OodFile {
  const entry = readmeTitles.get(dir)
  if (!entry) throw new Error(`README table has no OOD row for ${dir}`)
  const nb = JSON.parse(readFileSync(join(sourceRoot, entry.notebook), 'utf8')) as { cells: RawCell[] }
  const cells: NotebookCell[] = nb.cells.map((c) => ({
    cellType: c.cell_type,
    source: join_(c.source),
    outputs: (c.outputs ?? []).map((o) => join_(o.text ?? o.data?.['text/plain'])).filter((t) => t.length > 0),
  }))
  const h1 = cells.find((c) => c.cellType === 'markdown' && /^# /.test(c.source))
  if (!h1) throw new Error(`${entry.notebook}: no H1 cell`)

  const code = cells.find((c) => c.cellType === 'code')?.source ?? ''
  const writefile = /%%writefile (\S+)/.exec(code)?.[1]
  const modulePath = writefile ? `solutions/object_oriented_design/${dir}/${writefile}` : null
  const module =
    modulePath && existsSync(join(sourceRoot, modulePath))
      ? { path: modulePath, code: readFileSync(join(sourceRoot, modulePath), 'utf8') }
      : null

  const markdown = notebookToMarkdown(cells)
  return {
    id: oodIdFromDir(dir),
    dir,
    source: { ...base, path: entry.notebook },
    title: h1.source.replace(/^# /, '').trim(),
    readmeTitle: entry.title,
    cells,
    markdown,
    module,
    urls: extractRefs(markdown).urls,
  }
}
