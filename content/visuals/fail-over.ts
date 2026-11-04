import type { TopicVisual } from './types.ts'
import { failoverComparison, failoverCons, failoverSteps } from './_shared/availability.ts'

export default {
  topicId: 'fail-over',
  diagram: 'process',
  component: 'failover',
  stepsByMode: failoverSteps,
  comparison: failoverComparison,
  cons: failoverCons,
  related: ['active-passive', 'active-active', 'replication', 'load-balancer'],
} satisfies TopicVisual
