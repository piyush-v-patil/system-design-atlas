import { p, q, type Comparison } from '../types.ts'

export const partitionComparison: Comparison = {
  title: 'Federation vs sharding',
  columns: [
    { key: 'federation', title: 'Federation', topicId: 'federation' },
    { key: 'sharding', title: 'Sharding', topicId: 'sharding' },
  ],
  rows: [
    { label: 'Splits by', cells: { federation: q('splits up databases by function', 882), sharding: q('each database can only manage a subset of the data', 903) } },
    {
      label: 'Benefits',
      cells: {
        federation: q('less read and write traffic to each database and therefore less replication lag', 882),
        sharding: q('sharding results in less read and write traffic, less replication, and more cache hits', 905),
      },
    },
    {
      label: 'Writes',
      cells: {
        federation: q('With no single central master serializing writes you can write in parallel, increasing throughput.', 882),
        sharding: q('there is no single central master serializing writes, allowing you to write in parallel with increased throughput', 905),
      },
    },
    { label: 'Joins', cells: { federation: q('Joining data from two databases is more complex with a server link.', 888), sharding: q('Joining data from multiple shards is more complex.', 914) } },
  ],
  chooseWhen: {
    federation: p('The data splits cleanly by function (e.g. forums, users, products) and the schema does not need huge functions or tables', 882, 886),
    sharding: p('One kind of data (e.g. users) grows too large and can be split by a key such as last-name initial or location', 903, 907),
  },
}
