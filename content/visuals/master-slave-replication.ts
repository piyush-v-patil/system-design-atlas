import { q, type TopicVisual } from './types.ts'
import { replicationChoose, replicationComparison, replicationCons, replicationSteps } from './_shared/replication.ts'

export default {
  topicId: 'master-slave-replication',
  diagram: 'process',
  component: 'replication',
  props: { mode: 'master-slave', activeColumn: 'master-slave' },
  stepsByMode: replicationSteps,
  comparison: replicationComparison,
  useWhen: replicationChoose['master-slave'],
  cons: [q('Additional logic is needed to promote a slave to a master.', 841), ...replicationCons],
  related: ['master-master-replication', 'disadvantages-replication', 'active-passive', 'federation', 'sharding'],
  notes: ['“Disadvantage(s): replication” sits under the master-master heading in the Primer, but its text says it applies to both topologies, so it is listed here too (docs/PLAN.md F4).'],
} satisfies TopicVisual
