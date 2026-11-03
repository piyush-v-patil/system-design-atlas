import type { TopicVisual } from './types.ts'
import { consistencyChoose, consistencyComparison, consistencySteps } from './_shared/consistency.ts'

export default {
  topicId: 'strong-consistency',
  diagram: 'process',
  component: 'consistency',
  props: { mode: 'strong', activeColumn: 'strong' },
  stepsByMode: consistencySteps,
  comparison: consistencyComparison,
  useWhen: consistencyChoose.strong,
  related: ['weak-consistency', 'eventual-consistency', 'cp---consistency-and-partition-tolerance', 'relational-database-management-system-rdbms'],
} satisfies TopicVisual
