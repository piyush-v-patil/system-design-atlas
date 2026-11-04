import type { TopicVisual } from './types.ts'
import { layerChoose, layerComparison, layerSteps } from './_shared/loadBalancer.ts'

export default {
  topicId: 'layer-4-load-balancing',
  diagram: 'process',
  component: 'l4l7',
  props: { mode: 'L4', activeColumn: 'L4' },
  stepsByMode: layerSteps,
  comparison: layerComparison,
  useWhen: layerChoose.L4,
  related: ['layer-7-load-balancing', 'load-balancer', 'communication', 'transmission-control-protocol-tcp'],
} satisfies TopicVisual
