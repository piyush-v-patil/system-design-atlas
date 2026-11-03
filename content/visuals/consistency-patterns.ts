import { q, type TopicVisual } from './types.ts'
import { consistencyComparison, consistencySteps } from './_shared/consistency.ts'

export default {
  topicId: 'consistency-patterns',
  diagram: 'process',
  component: 'consistency',
  props: { mode: 'eventual' },
  summary: q('With multiple copies of the same data, we are faced with options on how to synchronize them so clients have a consistent view of the data.', 475),
  stepsByMode: consistencySteps,
  comparison: consistencyComparison,
  related: ['cap-theorem', 'master-slave-replication', 'master-master-replication'],
} satisfies TopicVisual
