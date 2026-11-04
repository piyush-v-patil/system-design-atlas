import { q, type TopicVisual } from './types.ts'
import { capComparison, capSteps } from './_shared/cap.ts'

export default {
  topicId: 'cap-theorem',
  diagram: 'process',
  component: 'cap',
  summary: q('In a distributed computer system, you can only support two of the following guarantees:', 448),
  stepsByMode: capSteps,
  comparison: capComparison,
  related: ['consistency-patterns', 'eventual-consistency', 'availability-patterns', 'nosql'],
} satisfies TopicVisual
