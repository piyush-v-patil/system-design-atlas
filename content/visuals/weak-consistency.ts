import type { TopicVisual } from './types.ts'
import { consistencyChoose, consistencyComparison, consistencySteps } from './_shared/consistency.ts'

export default {
  topicId: 'weak-consistency',
  diagram: 'process',
  component: 'consistency',
  props: { mode: 'weak', activeColumn: 'weak' },
  stepsByMode: consistencySteps,
  comparison: consistencyComparison,
  useWhen: consistencyChoose.weak,
  related: ['eventual-consistency', 'strong-consistency', 'cap-theorem'],
} satisfies TopicVisual
