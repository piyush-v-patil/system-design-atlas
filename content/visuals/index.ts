import type { TopicVisual } from './types.ts'

// Each content/visuals/<topic-id>.ts default-exports a TopicVisual. Phase 1 ships none (original layer only).
const modules = import.meta.glob<TopicVisual>(['./*.ts', '!./index.ts', '!./types.ts'], { eager: true, import: 'default' })

export const visuals: Record<string, TopicVisual> = Object.fromEntries(Object.values(modules).map((v) => [v.topicId, v]))

import topicsJson from '../topics.json'
const kinds = Object.fromEntries(Object.entries((topicsJson as { nodes: Record<string, { kind: string }> }).nodes).map(([id, n]) => [id, n.kind]))

/**
 * Hand-written metadata wins. "Disadvantage(s)" and "Source(s) and further reading" sections get a visual built
 * mechanically from their own text (src/visuals/auto.ts), so they need no metadata file.
 */
export const getVisual = (topicId: string): TopicVisual | undefined => {
  if (visuals[topicId]) return visuals[topicId]
  if (kinds[topicId] === 'disadvantages') return { topicId, diagram: 'reference', component: 'cons-list' }
  if (kinds[topicId] === 'sources') return { topicId, diagram: 'reference', component: 'reading-list' }
  return undefined
}
