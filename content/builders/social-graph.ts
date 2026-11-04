import { type Builder, e, n, PER_MONTH, STANDARD_FRAMES } from './types.ts'

// Frames: 0 = Step 1, 1 = Step 2, 2 = Step 3, 3 = Step 4.
const builder: Builder = {
  solutionId: 'social-graph',
  width: 640,
  height: 580,
  frames: STANDARD_FRAMES('http://i.imgur.com/wxXyq2J.png', 'http://i.imgur.com/cdCv5g7.png'),
  nodes: [
    n('client', 'Client', 'client', 200, 40, 0),
    n('dns', 'DNS', 'dns', 430, 40, 3),
    n('lb', 'Load Balancer', 'lb', 200, 145, 3, { multi: 3 }),
    n('web', 'Web Server', 'server', 200, 245, 1, { multi: 3 }),
    n('api', 'Search API', 'app', 200, 345, 1, { multi: 3, relabel: { from: 3, label: 'Query API' } }),
    n('userGraph', 'User Graph\nService', 'app', 200, 445, 2, { multi: 3 }),
    n('mc', 'Memory Cache', 'cache', 450, 395, 3, { multi: 3 }),
    n('lookup', 'Lookup\nService', 'app', 90, 535, 2, { multi: 3 }),
    n('person', 'Person\nServer', 'server', 310, 535, 2, { multi: 3, aka: ['Person Servers'] }),
  ],
  edges: [
    e('client', 'web', { until: 3 }),
    e('client', 'dns'),
    e('client', 'lb'),
    e('lb', 'web'),
    e('web', 'api'),
    e('api', 'userGraph'),
    e('userGraph', 'lookup'),
    e('userGraph', 'person'),
    e('api', 'mc'),
    e('userGraph', 'mc'),
  ],
  flows: [
    {
      title: 'User searches for someone and sees the shortest path to the searched person',
      line: 59,
      hops: [
        ['client', 'web', 104],
        ['web', 'api', 105],
        ['api', 'userGraph', 106],
        ['userGraph', 'lookup', 108],
        ['userGraph', 'person', 109],
        ['userGraph', 'lookup', 112],
      ],
    },
  ],
  math: [
    { label: 'Friend relationships', formula: '100 million users × 50 friends per user', value: 100e6 * 50, stated: 5e9, unit: 'count', line: 38, statedText: '5 billion friend relationships', inputs: [28, 29] },
    { label: 'Searches per second', formula: '1 billion searches per month ÷ 2.5 million seconds per month', value: 1e9 / PER_MONTH, stated: 400, unit: 'req/s', line: 40, statedText: '400 search requests per second', inputs: [30, 44] },
  ],
  additions: [
    { nodes: ['dns'], line: 265, topics: ['domain-name-system'] },
    { nodes: ['lb'], line: 259, topics: ['load-balancer', 'horizontal-scaling'] },
    { nodes: ['mc'], line: 274, topics: ['cache'] },
    { nodes: ['person'], line: 281, topics: ['sharding'] },
  ],
  notes: ['The final diagram relabels the “Search API” as “Query API”; the text only ever says Search API (L105).'],
}
export default builder
