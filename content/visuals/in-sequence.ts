import { q, type TopicVisual } from './types.ts'

export default {
  topicId: 'in-sequence',
  diagram: 'calculator',
  component: 'availability-calculator',
  props: { preset: 'series' },
  summary: q('If both Foo and Bar each had 99.9% availability, their total availability in sequence would be 99.8%.', 569),
  related: ['in-parallel', 'availability-in-numbers'],
} satisfies TopicVisual
