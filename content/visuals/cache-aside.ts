import { q, type TopicVisual } from './types.ts'
import { cacheChoose, cacheComparison } from './_shared/cache.ts'

export default {
  topicId: 'cache-aside',
  diagram: 'process',
  component: 'cache-strategy',
  props: { strategy: 'cache-aside', activeColumn: 'cache-aside' },
  summary: q('The application is responsible for reading and writing from storage. The cache does not interact with storage directly.', 1211),
  steps: [
    { caption: 'Look in the cache: a miss', source: q('Look for entry in cache, resulting in a cache miss', 1213) },
    { caption: 'Load the entry from the database', source: q('Load entry from the database', 1214) },
    { caption: 'Add the entry to the cache', source: q('Add entry to cache', 1215) },
    { caption: 'Return the entry to the caller', source: q('Return entry', 1216) },
    { caption: 'The next read is a fast cache hit', source: q('Subsequent reads of data added to cache are fast.', 1231) },
  ],
  comparison: cacheComparison,
  useWhen: cacheChoose['cache-aside'],
  pros: [q('Subsequent reads of data added to cache are fast.', 1231), q("Only requested data is cached, which avoids filling up the cache with data that isn't requested.", 1231)],
  cons: [
    q('Each cache miss results in three trips, which can cause a noticeable delay.', 1235),
    q('Data can become stale if it is updated in the database. This issue is mitigated by setting a time-to-live (TTL) which forces an update of the cache entry, or by using write-through.', 1236),
    q('When a node fails, it is replaced by a new, empty node, increasing latency.', 1237),
  ],
  related: ['write-through', 'when-to-update-the-cache', 'application-caching', 'key-value-store'],
} satisfies TopicVisual
