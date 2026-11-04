import type { TopicVisual } from './types.ts'
import { capChoose, capComparison, capSteps } from './_shared/cap.ts'

export default {
  topicId: 'ap---availability-and-partition-tolerance',
  diagram: 'process',
  component: 'cap',
  props: { mode: 'AP', activeColumn: 'AP' },
  stepsByMode: capSteps,
  comparison: capComparison,
  useWhen: capChoose.AP,
  related: ['cp---consistency-and-partition-tolerance', 'cap-theorem', 'eventual-consistency'],
} satisfies TopicVisual
