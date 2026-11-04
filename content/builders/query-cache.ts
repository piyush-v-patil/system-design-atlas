import { type Builder, e, n, PER_MONTH, STANDARD_FRAMES, TB } from './types.ts'

// Frames: 0 = Step 1, 1 = Step 2, 2 = Step 3, 3 = Step 4.
const builder: Builder = {
  solutionId: 'query-cache',
  width: 640,
  height: 520,
  frames: STANDARD_FRAMES('http://i.imgur.com/KqZ3dSx.png', 'http://i.imgur.com/4j99mhe.png'),
  nodes: [
    n('client', 'Client', 'client', 220, 40, 0),
    n('dns', 'DNS', 'dns', 450, 40, 3),
    n('lb', 'Load Balancer', 'lb', 220, 145, 3, { multi: 3 }),
    n('web', 'Web Server', 'server', 220, 245, 1, { multi: 3 }),
    n('query', 'Query API', 'app', 220, 345, 1, { multi: 3 }),
    n('mc', 'Memory Cache', 'cache', 470, 345, 1, { multi: 3 }),
    n('ri', 'Reverse Index\nService', 'app', 110, 465, 2, { multi: 3 }),
    n('doc', 'Document\nService', 'app', 330, 465, 2, { multi: 3 }),
  ],
  edges: [
    e('client', 'web', { until: 3 }),
    e('client', 'dns'),
    e('client', 'lb'),
    e('lb', 'web'),
    e('web', 'query'),
    e('query', 'mc'),
    e('query', 'ri'),
    e('query', 'doc'),
  ],
  flows: [
    {
      title: 'User sends a request resulting in a cache hit',
      line: 67,
      hops: [
        ['client', 'web', 73],
        ['web', 'query', 74],
        ['query', 'mc', 82],
        ['mc', 'query', 83],
        ['query', 'ri', 87],
        ['query', 'doc', 89],
        ['query', 'mc', 90],
      ],
    },
  ],
  math: [
    { label: 'Size per cache entry', formula: '50 + 20 + 200 bytes', value: 50 + 20 + 200, stated: 270, unit: 'B', line: 44, statedText: 'Total: 270 bytes', inputs: [41, 42, 43] },
    { label: 'Cache data per month (all unique)', formula: '270 bytes per search × 10 billion searches per month', value: 270 * 10e9, stated: 2.7 * TB, unit: 'B', line: 45, statedText: '2.7 TB of cache data per month', inputs: [44, 34] },
    { label: 'Requests per second', formula: '10 billion queries per month ÷ 2.5 million seconds per month', value: 10e9 / PER_MONTH, stated: 4_000, unit: 'req/s', line: 48, statedText: '4,000 requests per second', inputs: [34, 52] },
  ],
  additions: [
    { nodes: ['dns'], line: 227, topics: ['domain-name-system'] },
    { nodes: ['lb'], line: 221, topics: ['load-balancer', 'horizontal-scaling'] },
    { nodes: ['mc'], line: 238, topics: ['sharding', 'cache'] },
  ],
  notes: ['The use case is titled “cache hit” (L67) but its steps also cover the miss path (L86–90); the builder plays both, in the order written.'],
}
export default builder
