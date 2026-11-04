import { p, q, type Claim, type Comparison, type ProcessStep } from '../types.ts'

export const replicationSteps: Record<'master-slave' | 'master-master', ProcessStep[]> = {
  'master-slave': [
    { caption: 'Writes go to the master', source: q('The master serves reads and writes', 831) },
    { caption: 'The master replicates writes to the slaves', source: q('replicating writes to one or more slaves', 831) },
    { caption: 'Slaves serve reads', source: q('which serve only reads', 831) },
    { caption: 'A slave can replicate to further slaves, like a tree', source: q('Slaves can also replicate to additional slaves in a tree-like fashion.', 831) },
    {
      caption: 'The master goes offline: reads continue, writes stop',
      source: q('If the master goes offline, the system can continue to operate in read-only mode until a slave is promoted to a master or a new master is provisioned.', 831),
    },
    { caption: 'A slave is promoted to master', source: q('Additional logic is needed to promote a slave to a master.', 841) },
  ],
  'master-master': [
    { caption: 'Both masters serve reads and writes', source: q('Both masters serve reads and writes', 846) },
    { caption: 'They coordinate with each other on writes', source: q('coordinate with each other on writes', 846) },
    { caption: 'A load balancer (or app logic) decides where to write', source: q("You'll need a load balancer or you'll need to make changes to your application logic to determine where to write.", 856) },
    { caption: 'Concurrent writes to both masters can conflict', source: q('Conflict resolution comes more into play as more write nodes are added and as latency increases.', 858) },
    { caption: 'One master goes down: the other keeps reading and writing', source: q('If either master goes down, the system can continue to operate with both reads and writes.', 846) },
  ],
}

/** "Disadvantage(s): replication" applies to both topologies. */
export const replicationCons: Claim[] = [
  q('There is a potential for loss of data if the master fails before any newly written data can be replicated to other nodes.', 863),
  q("Writes are replayed to the read replicas. If there are a lot of writes, the read replicas can get bogged down with replaying writes and can't do as many reads.", 864),
  q('The more read slaves, the more you have to replicate, which leads to greater replication lag.', 865),
  q('On some systems, writing to the master can spawn multiple threads to write in parallel, whereas read replicas only support writing sequentially with a single thread.', 866),
  q('Replication adds more hardware and additional complexity.', 867),
]

export const replicationChoose = {
  'master-slave': p('Most traffic is reads, and a read-only period until a slave is promoted is acceptable', 831),
  'master-master': p('Writes must keep working when one master fails, and looser consistency or slower writes are acceptable', 846, 857),
}

export const replicationComparison: Comparison = {
  title: 'Master-slave vs master-master',
  columns: [
    { key: 'master-slave', title: 'Master-slave', topicId: 'master-slave-replication' },
    { key: 'master-master', title: 'Master-master', topicId: 'master-master-replication' },
  ],
  rows: [
    { label: 'Writes', cells: { 'master-slave': q('The master serves reads and writes', 831), 'master-master': q('Both masters serve reads and writes and coordinate with each other on writes.', 846) } },
    { label: 'Reads', cells: { 'master-slave': q('replicating writes to one or more slaves, which serve only reads', 831), 'master-master': q('Both masters serve reads and writes', 846) } },
    {
      label: 'If a master fails',
      cells: {
        'master-slave': q('If the master goes offline, the system can continue to operate in read-only mode until a slave is promoted to a master or a new master is provisioned.', 831),
        'master-master': q('If either master goes down, the system can continue to operate with both reads and writes.', 846),
      },
    },
    {
      label: 'Extra work',
      cells: {
        'master-slave': q('Additional logic is needed to promote a slave to a master.', 841),
        'master-master': q("You'll need a load balancer or you'll need to make changes to your application logic to determine where to write.", 856),
      },
    },
    {
      label: 'Consistency',
      cells: { 'master-slave': null, 'master-master': q('Most master-master systems are either loosely consistent (violating ACID) or have increased write latency due to synchronization.', 857) },
    },
  ],
  chooseWhen: replicationChoose,
}
