import type { TopicVisual } from './types.ts'
import { replicationComparison, replicationCons, replicationSteps } from './_shared/replication.ts'

export default {
  topicId: 'master-slave-and-master-master',
  diagram: 'process',
  component: 'replication',
  stepsByMode: replicationSteps,
  comparison: replicationComparison,
  cons: replicationCons,
  related: ['master-slave-replication', 'master-master-replication', 'disadvantages-replication'],
} satisfies TopicVisual
