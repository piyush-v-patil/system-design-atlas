import { q, type TopicVisual } from './types.ts'
import { cacheChoose, cacheComparison } from './_shared/cache.ts'

export default {
  topicId: 'write-through',
  diagram: 'process',
  component: 'cache-strategy',
  props: { strategy: 'write-through', activeColumn: 'write-through' },
  summary: q('The application uses the cache as the main data store, reading and writing data to it, while the cache is responsible for reading and writing to the database:', 1247),
  steps: [
    { caption: 'The application writes the entry to the cache', source: q('Application adds/updates entry in cache', 1249) },
    { caption: 'The cache synchronously writes it to the database', source: q('Cache synchronously writes entry to data store', 1250) },
    { caption: 'Then the write returns', source: q('Return', 1251) },
    { caption: 'Reads of just-written data are fast', source: q('subsequent reads of just written data are fast', 1267) },
  ],
  comparison: cacheComparison,
  useWhen: cacheChoose['write-through'],
  pros: [q('Data in the cache is not stale.', 1267), q('Users are generally more tolerant of latency when updating data than reading data.', 1267)],
  cons: [
    q('Write-through is a slow overall operation due to the write operation', 1267),
    q('When a new node is created due to failure or scaling, the new node will not cache entries until the entry is updated in the database. Cache-aside in conjunction with write through can mitigate this issue.', 1271),
    q('Most data written might never be read, which can be minimized with a TTL.', 1272),
  ],
  related: ['cache-aside', 'write-behind-write-back', 'when-to-update-the-cache'],
} satisfies TopicVisual
