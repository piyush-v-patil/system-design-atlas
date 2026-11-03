import type { TopicVisual } from './types.ts'

// Each content/visuals/<topic-id>.ts default-exports a TopicVisual. Phase 1 ships none (original layer only).
const modules = import.meta.glob<TopicVisual>(['./*.ts', '!./index.ts', '!./types.ts'], { eager: true, import: 'default' })

export const visuals: Record<string, TopicVisual> = Object.fromEntries(Object.values(modules).map((v) => [v.topicId, v]))

export const getVisual = (topicId: string): TopicVisual | undefined => visuals[topicId]
