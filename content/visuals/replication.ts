import { q, type TopicVisual } from './types.ts'
import { replicationComparison, replicationCons, replicationSteps } from './_shared/replication.ts'

export default {
  topicId: 'replication',
  diagram: 'process',
  component: 'replication',
  summary: q('This topic is further discussed in the Database section:', 530),
  stepsByMode: replicationSteps,
  comparison: replicationComparison,
  cons: replicationCons,
  related: ['master-slave-replication', 'master-master-replication', 'fail-over'],
} satisfies TopicVisual
