import type { TopicVisual } from './types.ts'

export default {
  topicId: '999-availability---three-9s',
  diagram: 'calculator',
  component: 'downtime-table',
  props: { availability: 0.999 },
  related: ['9999-availability---four-9s', 'availability-in-numbers', 'availability-in-parallel-vs-in-sequence'],
} satisfies TopicVisual
