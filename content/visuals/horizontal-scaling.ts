import { q, type TopicVisual } from './types.ts'

export default {
  topicId: 'horizontal-scaling',
  diagram: 'comparison',
  component: 'scaling',
  summary: q('Load balancers can also help with horizontal scaling, improving performance and availability.', 705),
  comparison: {
    title: 'Scaling up vs scaling out',
    columns: [
      { key: 'up', title: 'Vertical (scale up)' },
      { key: 'out', title: 'Horizontal (scale out)', topicId: 'horizontal-scaling' },
    ],
    rows: [
      { label: 'How', cells: { up: q('scaling up a single server on more expensive hardware, called Vertical Scaling', 705), out: q('Scaling out using commodity machines', 705) } },
      { label: 'Cost and availability', cells: { up: null, out: q('more cost efficient and results in higher availability than scaling up a single server on more expensive hardware', 705) } },
      { label: 'Hiring', cells: { up: null, out: q('It is also easier to hire for talent working on commodity hardware than it is for specialized enterprise systems.', 705) } },
      {
        label: 'State',
        cells: {
          up: null,
          out: q('Servers should be stateless: they should not contain any user-related data like sessions or profile pictures', 710),
        },
      },
    ],
  },
  pros: [q('more cost efficient and results in higher availability than scaling up a single server on more expensive hardware', 705)],
  cons: [
    q('Scaling horizontally introduces complexity and involves cloning servers', 709),
    q('Downstream servers such as caches and databases need to handle more simultaneous connections as upstream servers scale out', 712),
  ],
  useWhen: q('Sessions can be stored in a centralized data store such as a database (SQL, NoSQL) or a persistent cache (Redis, Memcached)', 711),
  related: ['load-balancer', 'cache', 'database', 'performance-vs-scalability'],
} satisfies TopicVisual
