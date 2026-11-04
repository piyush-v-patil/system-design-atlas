import { q, type TopicVisual } from './types.ts'
import { layerComparison, lbCons, lbPros } from './_shared/loadBalancer.ts'

export default {
  topicId: 'load-balancer',
  diagram: 'simulation',
  component: 'lb-sim',
  summary: q('Load balancers distribute incoming client requests to computing resources such as application servers and databases.', 668),
  comparison: layerComparison,
  pros: lbPros,
  cons: lbCons,
  related: ['layer-4-load-balancing', 'layer-7-load-balancing', 'horizontal-scaling', 'active-passive', 'active-active', 'reverse-proxy-web-server'],
  notes: ['The Primer’s Index lists Active-passive and Active-active under Load balancer; in the text they live under Availability patterns › Fail-over, which is where the map places them (docs/PLAN.md F3).'],
} satisfies TopicVisual
