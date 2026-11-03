import type { TopicVisual } from './types.ts'
import { failoverComparison, failoverCons, failoverSteps } from './_shared/availability.ts'

export default {
  topicId: 'active-passive',
  diagram: 'process',
  component: 'failover',
  props: { mode: 'active-passive', activeColumn: 'active-passive' },
  stepsByMode: failoverSteps,
  comparison: failoverComparison,
  cons: failoverCons,
  related: ['active-active', 'fail-over', 'master-slave-replication', 'load-balancer'],
} satisfies TopicVisual
