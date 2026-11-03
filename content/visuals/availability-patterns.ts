import { q, type TopicVisual } from './types.ts'
import { failoverSteps, patternsComparison } from './_shared/availability.ts'

export default {
  topicId: 'availability-patterns',
  diagram: 'comparison',
  component: 'failover',
  summary: q('There are two complementary patterns to support high availability: fail-over and replication.', 501),
  stepsByMode: failoverSteps,
  comparison: patternsComparison,
  related: ['fail-over', 'replication', 'availability-in-numbers', 'cap-theorem'],
} satisfies TopicVisual
