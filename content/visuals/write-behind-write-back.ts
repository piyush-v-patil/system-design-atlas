import { p, q, type TopicVisual } from './types.ts'
import { cacheChoose, cacheComparison } from './_shared/cache.ts'

export default {
  topicId: 'write-behind-write-back',
  diagram: 'process',
  component: 'cache-strategy',
  props: { strategy: 'write-behind', activeColumn: 'write-behind' },
  summary: q('In write-behind, the application does the following:', 1282),
  steps: [
    { caption: '1. The application writes A to the cache', source: q('Add/update entry in cache', 1284) },
    { caption: '2. The cache adds the write as an event to a queue', source: p('In the Primer’s diagram, the cache adds the write as an event to a queue (step 2)', 1276, 1279) },
    { caption: '3. The write returns right away', source: p('In the Primer’s diagram, the write returns to the user before the database is written (step 3)', 1276, 1279) },
    { caption: '4. An event processor writes A to the database asynchronously', source: q('Asynchronously write entry to the data store, improving write performance', 1285) },
    { caption: 'Write B: the cache goes down before B reaches the data store, so B is lost', source: q('There could be data loss if the cache goes down prior to its contents hitting the data store.', 1289) },
  ],
  comparison: cacheComparison,
  useWhen: cacheChoose['write-behind'],
  pros: [q('Asynchronously write entry to the data store, improving write performance', 1285)],
  cons: [
    q('There could be data loss if the cache goes down prior to its contents hitting the data store.', 1289),
    q('It is more complex to implement write-behind than it is to implement cache-aside or write-through.', 1290),
  ],
  notes: [
    'The Primer’s text says “the application” asynchronously writes to the data store, while its diagram shows the cache adding an event to a queue that an event processor writes to the database. This animation follows the diagram’s four numbered steps.',
  ],
  related: ['write-through', 'message-queues', 'when-to-update-the-cache'],
} satisfies TopicVisual
