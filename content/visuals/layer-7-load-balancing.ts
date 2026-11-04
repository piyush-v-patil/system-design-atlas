import type { TopicVisual } from './types.ts'
import { layerChoose, layerComparison, layerSteps } from './_shared/loadBalancer.ts'

export default {
  topicId: 'layer-7-load-balancing',
  diagram: 'process',
  component: 'l4l7',
  props: { mode: 'L7', activeColumn: 'L7' },
  stepsByMode: layerSteps,
  comparison: layerComparison,
  useWhen: layerChoose.L7,
  related: ['layer-4-load-balancing', 'load-balancer', 'communication', 'hypertext-transfer-protocol-http'],
} satisfies TopicVisual
