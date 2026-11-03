import topicsJson from '../../content/topics.json'
import imagesJson from '../../content/images.json'
import metaJson from '../../content/meta.json'
import type { Area, ContentMeta, ImagesFile, OodFile, SolutionFile, TopicNode, TopicsFile } from './types.ts'

export const topics = topicsJson as unknown as TopicsFile
export const images = imagesJson as unknown as ImagesFile
export const meta = metaJson as unknown as ContentMeta

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

export const rootId = topics.rootId
export const getTopic = (id: string | undefined): TopicNode | undefined => (id ? topics.nodes[id] : undefined)

export function prevNext(id: string): { prev?: TopicNode; next?: TopicNode } {
  const i = topics.order.indexOf(id)
  return { prev: getTopic(topics.order[i - 1]), next: getTopic(topics.order[i + 1]) }
}

/** All descendants of a node in source order (excluding the node). */
export function descendants(id: string): TopicNode[] {
  const out: TopicNode[] = []
  const walk = (nid: string) => {
    for (const c of topics.nodes[nid].childIds) {
      out.push(topics.nodes[c])
      walk(c)
    }
  }
  walk(id)
  return out
}

export const AREA_LABEL: Record<Area, string> = {
  fundamentals: 'Fundamentals',
  networking: 'Networking',
  data: 'Data',
  caching: 'Caching',
  async: 'Async',
  communication: 'Communication',
  security: 'Security',
  appendix: 'Appendix',
  guide: 'Guide',
}
export const areaColor = (a: Area) => `var(--area-${a})`

export const githubBlob = (path: string, lines?: [number, number]) =>
  `${meta.repo}/blob/${meta.commit}/${path.split('/').map(encodeURIComponent).join('/')}` +
  (lines ? `#L${lines[0]}-L${lines[1]}` : '')

export function imageSrc(ref: string): { src: string; entry: ImagesFile['entries'][string] | undefined } {
  const entry = images.entries[ref]
  return { src: entry ? `${import.meta.env.BASE_URL}${entry.src}` : ref, entry }
}
