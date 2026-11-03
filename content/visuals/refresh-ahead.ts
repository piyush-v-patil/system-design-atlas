import { q, type TopicVisual } from './types.ts'
import { cacheChoose, cacheComparison } from './_shared/cache.ts'

export default {
  topicId: 'refresh-ahead',
  diagram: 'process',
  component: 'cache-strategy',
  props: { strategy: 'refresh-ahead', activeColumn: 'refresh-ahead' },
  summary: q('You can configure the cache to automatically refresh any recently accessed cache entry prior to its expiration.', 1300),
  steps: [
    { caption: 'Reads hit an entry whose TTL is running down', source: q('You can configure the cache to automatically refresh any recently accessed cache entry prior to its expiration.', 1300) },
    { caption: 'Before it expires, the cache refreshes it from the database', source: q('automatically refresh any recently accessed cache entry prior to its expiration', 1300) },
    {
      caption: 'The next read still hits: no miss latency',
      source: q('Refresh-ahead can result in reduced latency vs read-through if the cache can accurately predict which items are likely to be needed in the future.', 1302),
    },
    {
      caption: 'A wrong guess refreshes an entry nobody reads',
      source: q('Not accurately predicting which items are likely to be needed in the future can result in reduced performance than without refresh-ahead.', 1306),
    },
  ],
  comparison: cacheComparison,
  useWhen: cacheChoose['refresh-ahead'],
  pros: [q('Refresh-ahead can result in reduced latency vs read-through if the cache can accurately predict which items are likely to be needed in the future.', 1302)],
  cons: [q('Not accurately predicting which items are likely to be needed in the future can result in reduced performance than without refresh-ahead.', 1306)],
  notes: ['The Primer compares refresh-ahead with “read-through” but never defines read-through, so this card does not explain it (docs/PLAN.md F5).'],
  related: ['cache-aside', 'write-through', 'when-to-update-the-cache'],
} satisfies TopicVisual
