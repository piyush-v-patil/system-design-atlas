import { q, type TopicVisual } from './types.ts'
import { cacheComparison } from './_shared/cache.ts'

export default {
  topicId: 'when-to-update-the-cache',
  diagram: 'comparison',
  component: 'cache-paths',
  summary: q("Since you can only store a limited amount of data in cache, you'll need to determine which cache update strategy works best for your use case.", 1201),
  comparison: cacheComparison,
  related: ['cache-aside', 'write-through', 'write-behind-write-back', 'refresh-ahead', 'application-caching'],
} satisfies TopicVisual
