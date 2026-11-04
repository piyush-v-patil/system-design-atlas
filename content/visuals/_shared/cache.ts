import { p, q, type Comparison } from '../types.ts'

export const cacheChoose = {
  'cache-aside': p('Only requested data should be cached (lazy loading), and occasional stale reads are acceptable; Memcached is generally used this way', 1229, 1236),
  'write-through': p('Cached data must not be stale and users can tolerate slower writes', 1267),
  'write-behind': p('Write performance matters more than the risk of losing writes that have not reached the data store', 1285, 1289),
  'refresh-ahead': p('The cache can accurately predict which entries will be needed again', 1302),
}

export const cacheComparison: Comparison = {
  title: 'Four cache update strategies',
  columns: [
    { key: 'cache-aside', title: 'Cache-aside', topicId: 'cache-aside' },
    { key: 'write-through', title: 'Write-through', topicId: 'write-through' },
    { key: 'write-behind', title: 'Write-behind', topicId: 'write-behind-write-back' },
    { key: 'refresh-ahead', title: 'Refresh-ahead', topicId: 'refresh-ahead' },
  ],
  rows: [
    {
      label: 'Who writes to the database',
      cells: {
        'cache-aside': q('The application is responsible for reading and writing from storage.', 1211),
        'write-through': q('Cache synchronously writes entry to data store', 1250),
        'write-behind': q('Asynchronously write entry to the data store, improving write performance', 1285),
        'refresh-ahead': null,
      },
    },
    {
      label: 'Reads',
      cells: {
        'cache-aside': q('Subsequent reads of data added to cache are fast.', 1231),
        'write-through': q('subsequent reads of just written data are fast', 1267),
        'write-behind': null,
        'refresh-ahead': q('automatically refresh any recently accessed cache entry prior to its expiration', 1300),
      },
    },
    {
      label: 'Staleness',
      cells: {
        'cache-aside': q('Data can become stale if it is updated in the database.', 1236),
        'write-through': q('Data in the cache is not stale.', 1267),
        'write-behind': null,
        'refresh-ahead': null,
      },
    },
    {
      label: 'Main risk',
      cells: {
        'cache-aside': q('Each cache miss results in three trips, which can cause a noticeable delay.', 1235),
        'write-through': q('Most data written might never be read, which can be minimized with a TTL.', 1272),
        'write-behind': q('There could be data loss if the cache goes down prior to its contents hitting the data store.', 1289),
        'refresh-ahead': q('Not accurately predicting which items are likely to be needed in the future can result in reduced performance than without refresh-ahead.', 1306),
      },
    },
  ],
  chooseWhen: cacheChoose,
}
