import { q, type TopicVisual } from './types.ts'
import { partitionComparison } from './_shared/partitioning.ts'

export default {
  topicId: 'sharding',
  diagram: 'process',
  component: 'sharding',
  steps: [
    { caption: 'Each database manages only a subset of the data', source: q('Sharding distributes data across different databases such that each database can only manage a subset of the data.', 903) },
    { caption: 'Route each user by last-name initial or by location', source: q("Common ways to shard a table of users is either through the user's last name initial or the user's geographic location.", 907) },
    { caption: 'Smaller indexes per shard mean faster queries', source: q('Index size is also reduced, which generally improves performance with faster queries.', 905) },
    { caption: 'One shard goes down; the others keep working', source: q("If one shard goes down, the other shards are still operational, although you'll want to add some form of replication to avoid data loss.", 905) },
    { caption: 'Power users make one shard hot', source: q('For example, a set of power users on a shard could result in increased load to that shard compared to others.', 912) },
    { caption: 'More users: add a shard, and some users have to move', source: q('Rebalancing adds additional complexity.', 913) },
    { caption: 'Joins across shards get harder', source: q('Joining data from multiple shards is more complex.', 914) },
  ],
  comparison: partitionComparison,
  useWhen: partitionComparison.chooseWhen!.sharding,
  pros: [
    q('sharding results in less read and write traffic, less replication, and more cache hits', 905),
    q('Index size is also reduced, which generally improves performance with faster queries.', 905),
    q('there is no single central master serializing writes, allowing you to write in parallel with increased throughput', 905),
  ],
  cons: [
    q("You'll need to update your application logic to work with shards, which could result in complex SQL queries.", 911),
    q('Data distribution can become lopsided in a shard.', 912),
    q('Rebalancing adds additional complexity.', 913),
    q('Joining data from multiple shards is more complex.', 914),
    q('Sharding adds more hardware and additional complexity.', 915),
  ],
  notes: [
    'The Primer says “A sharding function based on consistent hashing can reduce the amount of transferred data” and links to an article, but does not explain consistent hashing. The rebalancing step uses simple range splits and does not model consistent hashing.',
  ],
  related: ['federation', 'denormalization', 'master-slave-replication', 'under-development'],
} satisfies TopicVisual
