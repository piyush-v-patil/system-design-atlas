import type { TopicVisual } from './types.ts'
import { consistencyChoose, consistencyComparison, consistencySteps } from './_shared/consistency.ts'

export default {
  topicId: 'eventual-consistency',
  diagram: 'process',
  component: 'consistency',
  props: { mode: 'eventual', activeColumn: 'eventual' },
  stepsByMode: consistencySteps,
  comparison: consistencyComparison,
  useWhen: consistencyChoose.eventual,
  related: ['weak-consistency', 'strong-consistency', 'ap---availability-and-partition-tolerance', 'nosql'],
} satisfies TopicVisual
