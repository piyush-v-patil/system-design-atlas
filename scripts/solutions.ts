import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SolutionFile, SolutionStep, SourceRef, TopicsFile } from '../src/lib/types.ts'
import { splitSections } from './util/markdown.ts'

export function solutionIdFromDir(dir: string): string {
  return dir.replace(/_/g, '-')
}

/** README table rows: "| Design Pastebin.com (or Bit.ly) | [Solution](solutions/system_design/pastebin/README.md) |" */
export function readmeSolutionTitles(readme: string): Map<string, string> {
  const map = new Map<string, string>()
  const re = /^\|\s*([^|]+?)\s*\|\s*\[Solution\]\(solutions\/system_design\/([^/]+)\/README\.md\)/gm
  for (const m of readme.matchAll(re)) map.set(m[2], m[1])
  return map
}

export function buildSolution(
  sourceRoot: string,
  dir: string,
  base: Omit<SourceRef, 'path'>,
  readmeTitles: Map<string, string>,
  topics: TopicsFile,
): SolutionFile {
  const path = `solutions/system_design/${dir}/README.md`
  const src = readFileSync(join(sourceRoot, path), 'utf8')
  const doc = splitSections(src, { ...base, path })
  const root = doc.nodes[doc.rootId]

  const steps: SolutionStep[] = []
  for (const childId of root.childIds) {
    const child = doc.nodes[childId]
    const m = /^Step (\d): (.+)$/.exec(child.title)
    if (m) steps.push({ step: Number(m[1]) as 1 | 2 | 3 | 4, label: m[2], nodeId: childId })
    else if (child.title === 'Additional talking points') steps.push({ step: 5, label: child.title, nodeId: childId })
    else throw new Error(`${path}: unexpected top-level section "${child.title}"`)
  }
  const stepNumbers = steps.map((s) => s.step).join(',')
  if (stepNumbers !== '1,2,3,4,5') throw new Error(`${path}: expected Steps 1–4 + talking points, got ${stepNumbers}`)

  const readmeTitle = readmeTitles.get(dir)
  if (!readmeTitle) throw new Error(`README table has no row for ${dir}`)
  // The README introduces each problem with an H3 whose body links to the solution.
  const readmeTopicId = topics.order.find(
    (id) => topics.nodes[id].depth === 3 && topics.nodes[id].urls.includes(path),
  )
  if (!readmeTopicId) throw new Error(`No README heading links to ${path}`)

  return { ...doc, id: solutionIdFromDir(dir), dir, title: root.title, readmeTitle, readmeTopicId, steps }
}
