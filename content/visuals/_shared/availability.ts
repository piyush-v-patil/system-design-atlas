import { p, q, type Claim, type Comparison, type ProcessStep } from '../types.ts'

export const failoverSteps: Record<'active-passive' | 'active-active', ProcessStep[]> = {
  'active-passive': [
    { caption: 'Only the active server handles traffic', source: q('Only the active server handles traffic.', 509) },
    { caption: 'Heartbeats flow between the active and the passive server', source: q('With active-passive fail-over, heartbeats are sent between the active and the passive server on standby.', 507) },
    { caption: 'The active server fails: the heartbeat is interrupted', source: q('If the heartbeat is interrupted', 507) },
    { caption: 'The passive server takes over the IP address and resumes service', source: q("the passive server takes over the active's IP address and resumes service", 507) },
    {
      caption: 'How long that takes depends on hot or cold standby',
      source: q("The length of downtime is determined by whether the passive server is already running in 'hot' standby or whether it needs to start up from 'cold' standby.", 509),
    },
  ],
  'active-active': [
    { caption: 'Both servers manage traffic, spreading the load', source: q('In active-active, both servers are managing traffic, spreading the load between them.', 515) },
    { caption: 'Public-facing: DNS must know both public IPs', source: q('If the servers are public-facing, the DNS would need to know about the public IPs of both servers.', 517) },
    { caption: 'Internal-facing: application logic must know both servers', source: q('If the servers are internal-facing, application logic would need to know about both servers.', 517) },
    { caption: 'If one server fails, the other is already serving', source: p('With both servers already handling traffic, the remaining server keeps serving when one fails', 515) },
  ],
}

export const failoverCons: Claim[] = [
  q('Fail-over adds more hardware and additional complexity.', 523),
  q('There is a potential for loss of data if the active system fails before any newly written data can be replicated to the passive.', 524),
]

export const failoverComparison: Comparison = {
  title: 'Active-passive vs active-active',
  columns: [
    { key: 'active-passive', title: 'Active-passive', topicId: 'active-passive' },
    { key: 'active-active', title: 'Active-active', topicId: 'active-active' },
  ],
  rows: [
    { label: 'Handles traffic', cells: { 'active-passive': q('Only the active server handles traffic.', 509), 'active-active': q('both servers are managing traffic, spreading the load between them', 515) } },
    {
      label: 'On failure',
      cells: { 'active-passive': q("the passive server takes over the active's IP address and resumes service", 507), 'active-active': p('The other server is already serving traffic', 515) },
    },
    {
      label: 'Downtime',
      cells: {
        'active-passive': q("The length of downtime is determined by whether the passive server is already running in 'hot' standby or whether it needs to start up from 'cold' standby.", 509),
        'active-active': null,
      },
    },
    {
      label: 'Who must know the servers',
      cells: {
        'active-passive': q('heartbeats are sent between the active and the passive server on standby', 507),
        'active-active': q('If the servers are public-facing, the DNS would need to know about the public IPs of both servers.', 517),
      },
    },
    {
      label: 'Also called',
      cells: {
        'active-passive': q('Active-passive failover can also be referred to as master-slave failover.', 511),
        'active-active': q('Active-active failover can also be referred to as master-master failover.', 519),
      },
    },
  ],
}

export const patternsComparison: Comparison = {
  title: 'Fail-over and replication patterns',
  columns: [
    { key: 'ap', title: 'Active-passive', topicId: 'active-passive' },
    { key: 'aa', title: 'Active-active', topicId: 'active-active' },
    { key: 'ms', title: 'Master-slave', topicId: 'master-slave-replication' },
    { key: 'mm', title: 'Master-master', topicId: 'master-master-replication' },
  ],
  rows: [
    {
      label: 'Serves traffic',
      cells: {
        ap: q('Only the active server handles traffic.', 509),
        aa: q('both servers are managing traffic, spreading the load between them', 515),
        ms: q('The master serves reads and writes, replicating writes to one or more slaves, which serve only reads.', 831),
        mm: q('Both masters serve reads and writes and coordinate with each other on writes.', 846),
      },
    },
    {
      label: 'When one fails',
      cells: {
        ap: q("If the heartbeat is interrupted, the passive server takes over the active's IP address and resumes service.", 507),
        aa: null,
        ms: q('If the master goes offline, the system can continue to operate in read-only mode until a slave is promoted to a master or a new master is provisioned.', 831),
        mm: q('If either master goes down, the system can continue to operate with both reads and writes.', 846),
      },
    },
    {
      label: 'Also called',
      cells: {
        ap: q('Active-passive failover can also be referred to as master-slave failover.', 511),
        aa: q('Active-active failover can also be referred to as master-master failover.', 519),
        ms: null,
        mm: null,
      },
    },
  ],
}

export const F1_NOTE =
  'The Primer’s 99.99% table lists “1m 5s” of downtime per week, but 0.01% of a week is 60.48 s (1m 0.5s). Every other cell matches the arithmetic, so this looks like a typo; the original table is shown unchanged in the Original text (docs/PLAN.md F1).'
