import { q, type TopicVisual } from './types.ts'

export default {
  topicId: 'availability-in-parallel-vs-in-sequence',
  diagram: 'calculator',
  component: 'availability-calculator',
  props: { preset: 'series' },
  summary: q("If a service consists of multiple components prone to failure, the service's overall availability depends on whether the components are in sequence or in parallel.", 559),
  related: ['in-sequence', 'in-parallel', 'availability-in-numbers'],
} satisfies TopicVisual
