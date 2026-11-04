import { PATH_STAGES, PRACTICE_FROM_APPENDIX, type PathStageDef } from '../../content/visuals/_shared/path.ts'
import { topics } from './content.ts'
import type { TopicNode } from './types.ts'

export interface PathStage extends PathStageDef {
  index: number
  /** Breadth: each section and its main subtopics (H2 and H3 in the Primer). */
  breadth: string[]
  /** Depth: the detailed subsections (H4 and below). */
  depth: string[]
}

const isTopic = (n: TopicNode) => n.kind === 'topic'

function subtree(id: string, skip: Set<string>): TopicNode[] {
  const n = topics.nodes[id]
  if (skip.has(id)) return []
  return [n, ...n.childIds.flatMap((c) => subtree(c, skip))]
}

export const PATH: PathStage[] = PATH_STAGES.map((def, index) => {
  const skip = new Set(def.id === 'numbers' ? PRACTICE_FROM_APPENDIX : [])
  const nodes = def.sections.flatMap((s) => subtree(s, skip)).filter(isTopic)
  const sectionDepth = (n: TopicNode) => n.level - Math.min(...def.sections.map((s) => topics.nodes[s].level))
  // Within a stage, "breadth" is the section itself plus its direct subtopics; the rest is depth.
  const breadth = nodes.filter((n) => def.sections.includes(n.id) || sectionDepth(n) <= 1).map((n) => n.id)
  const depth = nodes.filter((n) => !breadth.includes(n.id)).map((n) => n.id)
  return { ...def, index, breadth, depth }
})

/** Every topic on the path, in path order (breadth and depth interleaved in README order within a stage). */
export const PATH_ORDER: string[] = PATH.flatMap((s) => [...s.breadth, ...s.depth].sort((a, b) => topics.nodes[a].order - topics.nodes[b].order))

const stageOf = new Map<string, PathStage>()
for (const s of PATH) for (const id of [...s.breadth, ...s.depth]) stageOf.set(id, s)

/** Where a topic sits on the path; satellites and off-path nodes map to their nearest ancestor on the path. */
export function pathPosition(id: string): { stage: PathStage; anchorId: string; index: number } | null {
  let cur: string | null = id
  while (cur) {
    const s = stageOf.get(cur)
    if (s) return { stage: s, anchorId: cur, index: PATH_ORDER.indexOf(cur) }
    cur = topics.nodes[cur]?.parentId ?? null
  }
  return null
}

export function nextOnPath(id: string): TopicNode | undefined {
  const pos = pathPosition(id)
  if (!pos) return topics.nodes[PATH_ORDER[0]]
  const nextId = PATH_ORDER[pos.anchorId === id ? pos.index + 1 : pos.index + 1]
  return nextId ? topics.nodes[nextId] : undefined
}

export const isDepth = (id: string) => PATH.some((s) => s.depth.includes(id))
