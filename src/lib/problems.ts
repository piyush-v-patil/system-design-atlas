/** The full solution and OOD notebook files. Imported only by the pages that show them, so they load on demand. */
import { topics } from './content.ts'
import type { OodFile, SolutionFile } from './types.ts'

const solutionModules = import.meta.glob<SolutionFile>('../../content/solutions/*.json', { eager: true, import: 'default' })
const oodModules = import.meta.glob<OodFile>('../../content/ood/*.json', { eager: true, import: 'default' })

export const solutions: SolutionFile[] = Object.values(solutionModules).sort(
  (a, b) => topics.nodes[a.readmeTopicId].order - topics.nodes[b.readmeTopicId].order,
)
export const oods: OodFile[] = Object.values(oodModules)
// Keep the README table order for OOD problems.
const oodOrder = topics.nodes['object-oriented-design-interview-questions-with-solutions'].markdown
oods.sort((a, b) => oodOrder.indexOf(a.source.path) - oodOrder.indexOf(b.source.path))

export const solutionById = new Map(solutions.map((s) => [s.id, s]))
export const oodById = new Map(oods.map((o) => [o.id, o]))
export const solutionByDir = new Map(solutions.map((s) => [s.dir, s]))
export const oodByDir = new Map(oods.map((o) => [o.dir, o]))
export const solutionByReadmeTopic = new Map(solutions.map((s) => [s.readmeTopicId, s]))

