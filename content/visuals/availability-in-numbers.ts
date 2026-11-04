import { q, type TopicVisual } from './types.ts'
import { F1_NOTE } from './_shared/availability.ts'

export default {
  topicId: 'availability-in-numbers',
  diagram: 'calculator',
  component: 'availability-calculator',
  props: { preset: 'stack' },
  summary: q('Availability is often quantified by uptime (or downtime) as a percentage of time the service is available.', 537),
  notes: [F1_NOTE],
  related: ['999-availability---three-9s', '9999-availability---four-9s', 'in-sequence', 'in-parallel', 'fail-over'],
} satisfies TopicVisual
