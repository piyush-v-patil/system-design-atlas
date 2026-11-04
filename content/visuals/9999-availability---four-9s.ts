import type { TopicVisual } from './types.ts'
import { F1_NOTE } from './_shared/availability.ts'

export default {
  topicId: '9999-availability---four-9s',
  diagram: 'calculator',
  component: 'downtime-table',
  props: { availability: 0.9999 },
  notes: [F1_NOTE],
  related: ['999-availability---three-9s', 'availability-in-numbers', 'availability-in-parallel-vs-in-sequence'],
} satisfies TopicVisual
