import type { ComponentType } from 'react'
import type { TopicVisual } from '../../content/visuals/types.ts'
import type { TopicNode } from '../lib/types.ts'
import { CapVisual } from './topics/cap.tsx'
import { ConsistencyVisual } from './topics/consistency.tsx'
import { FailoverVisual } from './topics/failover.tsx'
import { ReplicationVisual } from './topics/replication.tsx'
import { LoadBalancerSim, L4L7Visual, ScalingVisual } from './topics/loadBalancer.tsx'
import { FederationVisual, ShardingVisual } from './topics/partitioning.tsx'
import { CachePathsVisual, CacheStrategyVisual } from './topics/cache.tsx'
import { AvailabilityCalculator, DowntimeTable } from './topics/availability.tsx'

export interface VisualProps {
  visual: TopicVisual
  node: TopicNode
}

export const registry: Record<string, ComponentType<VisualProps>> = {
  cap: CapVisual,
  consistency: ConsistencyVisual,
  failover: FailoverVisual,
  replication: ReplicationVisual,
  'lb-sim': LoadBalancerSim,
  l4l7: L4L7Visual,
  scaling: ScalingVisual,
  federation: FederationVisual,
  sharding: ShardingVisual,
  'cache-strategy': CacheStrategyVisual,
  'cache-paths': CachePathsVisual,
  'availability-calculator': AvailabilityCalculator,
  'downtime-table': DowntimeTable,
}
