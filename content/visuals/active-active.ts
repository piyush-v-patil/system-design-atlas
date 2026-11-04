import type { TopicVisual } from './types.ts'
import { failoverComparison, failoverCons, failoverSteps } from './_shared/availability.ts'

export default {
  topicId: 'active-active',
  diagram: 'process',
  component: 'failover',
  props: { mode: 'active-active', activeColumn: 'active-active' },
  stepsByMode: failoverSteps,
  comparison: failoverComparison,
  cons: failoverCons,
  related: ['active-passive', 'fail-over', 'master-master-replication', 'load-balancer'],
} satisfies TopicVisual
