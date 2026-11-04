import { q, type TopicVisual } from './types.ts'

export default {
  topicId: 'in-parallel',
  diagram: 'calculator',
  component: 'availability-calculator',
  props: { preset: 'parallel' },
  summary: q('If both Foo and Bar each had 99.9% availability, their total availability in parallel would be 99.9999%.', 579),
  related: ['in-sequence', 'availability-in-numbers', 'active-active'],
} satisfies TopicVisual
