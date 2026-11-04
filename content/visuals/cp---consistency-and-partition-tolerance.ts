import type { TopicVisual } from './types.ts'
import { capChoose, capComparison, capSteps } from './_shared/cap.ts'

export default {
  topicId: 'cp---consistency-and-partition-tolerance',
  diagram: 'process',
  component: 'cap',
  props: { mode: 'CP', activeColumn: 'CP' },
  stepsByMode: capSteps,
  comparison: capComparison,
  useWhen: capChoose.CP,
  related: ['ap---availability-and-partition-tolerance', 'cap-theorem', 'strong-consistency'],
} satisfies TopicVisual
