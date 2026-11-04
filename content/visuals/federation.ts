import { q, type TopicVisual } from './types.ts'
import { partitionComparison } from './_shared/partitioning.ts'

export default {
  topicId: 'federation',
  diagram: 'process',
  component: 'federation',
  steps: [
    { caption: 'One monolithic database takes every read and write', source: q('instead of a single, monolithic database, you could have three databases: forums, users, and products', 882) },
    { caption: 'Split the databases by function', source: q('Federation (or functional partitioning) splits up databases by function.', 882) },
    { caption: 'Each database gets less traffic and less replication lag', source: q('resulting in less read and write traffic to each database and therefore less replication lag', 882) },
    { caption: 'Smaller databases fit in memory: more cache hits', source: q('Smaller databases result in more data that can fit in memory, which in turn results in more cache hits due to improved cache locality.', 882) },
    { caption: 'No single central master: writes happen in parallel', source: q('With no single central master serializing writes you can write in parallel, increasing throughput.', 882) },
    { caption: 'The application must know which database to use', source: q("You'll need to update your application logic to determine which database to read and write.", 887) },
    { caption: 'Joining across databases needs a server link', source: q('Joining data from two databases is more complex with a server link.', 888) },
  ],
  comparison: partitionComparison,
  useWhen: partitionComparison.chooseWhen!.federation,
  pros: [
    q('less read and write traffic to each database and therefore less replication lag', 882),
    q('Smaller databases result in more data that can fit in memory, which in turn results in more cache hits due to improved cache locality.', 882),
    q('With no single central master serializing writes you can write in parallel, increasing throughput.', 882),
  ],
  cons: [
    q('Federation is not effective if your schema requires huge functions or tables.', 886),
    q("You'll need to update your application logic to determine which database to read and write.", 887),
    q('Joining data from two databases is more complex with a server link.', 888),
    q('Federation adds more hardware and additional complexity.', 889),
  ],
  related: ['sharding', 'denormalization', 'master-slave-replication', 'sql-tuning'],
} satisfies TopicVisual
