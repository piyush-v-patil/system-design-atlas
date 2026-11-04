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
import { LearningPathVisual, StudyGuideVisual } from './topics/path.tsx'
import { ConsList, KeyPoints, ReadingList, TableExplorer } from './topics/lists.tsx'
import { AppLayerVisual, CdnVisual, DnsVisual, LbVsProxyVisual, MicroservicesVisual, ReverseProxyVisual, ServiceDiscoveryVisual } from './topics/networking.tsx'
import { AcidBase, DataModelVisual, DenormalizationVisual, SqlNoSqlPicker } from './topics/data.tsx'
import { CacheGranularityVisual, CacheLayersVisual } from './topics/caching.tsx'
import { AsyncFlowVisual, BackPressureSim, MessageQueueVisual, TaskQueueVisual } from './topics/async.tsx'
import { HttpVerbsVisual, OsiVisual, RestVisual, RpcRestTableVisual, RpcVisual, TcpUdpVisual } from './topics/communication.tsx'
import { EnvelopeCalc, LatencyChart, LatencyThroughputVisual, PerfScaleVisual, PowersOfTwo } from './topics/numbers.tsx'
import { InterviewSteps, OodGallery, ProblemCard, ProblemGallery } from './topics/guide.tsx'

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
  'learning-path': LearningPathVisual,
  'study-guide': StudyGuideVisual,
  'cons-list': ConsList,
  'reading-list': ReadingList,
  'key-points': KeyPoints,
  'table-explorer': TableExplorer,
  dns: DnsVisual,
  cdn: CdnVisual,
  'reverse-proxy': ReverseProxyVisual,
  'lb-vs-proxy': LbVsProxyVisual,
  'app-layer': AppLayerVisual,
  microservices: MicroservicesVisual,
  'service-discovery': ServiceDiscoveryVisual,
  'acid-base': AcidBase,
  'data-model': DataModelVisual,
  'sql-nosql-picker': SqlNoSqlPicker,
  denormalization: DenormalizationVisual,
  'cache-layers': CacheLayersVisual,
  'cache-granularity': CacheGranularityVisual,
  'async-flow': AsyncFlowVisual,
  'message-queue': MessageQueueVisual,
  'task-queue': TaskQueueVisual,
  'back-pressure': BackPressureSim,
  osi: OsiVisual,
  'http-verbs': HttpVerbsVisual,
  'tcp-udp': TcpUdpVisual,
  rpc: RpcVisual,
  rest: RestVisual,
  'rpc-rest-table': RpcRestTableVisual,
  'latency-chart': LatencyChart,
  'powers-of-two': PowersOfTwo,
  envelope: EnvelopeCalc,
  'perf-scale': PerfScaleVisual,
  'latency-throughput': LatencyThroughputVisual,
  'interview-steps': InterviewSteps,
  'problem-gallery': ProblemGallery,
  'problem-card': ProblemCard,
  'ood-gallery': OodGallery,
}
