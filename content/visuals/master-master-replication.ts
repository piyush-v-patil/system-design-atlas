import { q, type TopicVisual } from './types.ts'
import { replicationChoose, replicationComparison, replicationCons, replicationSteps } from './_shared/replication.ts'

export default {
  topicId: 'master-master-replication',
  diagram: 'process',
  component: 'replication',
  props: { mode: 'master-master', activeColumn: 'master-master' },
  stepsByMode: replicationSteps,
  comparison: replicationComparison,
  useWhen: replicationChoose['master-master'],
  cons: [
    q("You'll need a load balancer or you'll need to make changes to your application logic to determine where to write.", 856),
    q('Most master-master systems are either loosely consistent (violating ACID) or have increased write latency due to synchronization.', 857),
    q('Conflict resolution comes more into play as more write nodes are added and as latency increases.', 858),
    ...replicationCons,
  ],
  related: ['master-slave-replication', 'disadvantages-replication', 'active-active', 'load-balancer'],
} satisfies TopicVisual
