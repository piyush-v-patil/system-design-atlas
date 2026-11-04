import { type Builder, e, KB, n, PB, PER_MONTH, STANDARD_FRAMES } from './types.ts'

// Frames: 0 = Step 1, 1 = Step 2, 2 = Step 3, 3 = Step 4. The user-search path is drawn dash-dot, as in the Primer.
const builder: Builder = {
  solutionId: 'web-crawler',
  width: 760,
  height: 560,
  frames: STANDARD_FRAMES('http://i.imgur.com/xjdAAUv.png', 'http://i.imgur.com/bWxPtQA.png'),
  nodes: [
    n('client', 'Client', 'client', 120, 40, 0),
    n('dns', 'DNS', 'dns', 330, 40, 3),
    n('lb', 'Load Balancer', 'lb', 120, 145, 3, { multi: 3 }),
    n('web', 'Web Server', 'server', 120, 250, 1, { multi: 3 }),
    n('query', 'Query API', 'app', 120, 360, 1, { multi: 3 }),
    n('mc', 'Memory Cache', 'cache', 120, 480, 3, { multi: 3 }),
    n('crawler', 'Crawler\nService', 'app', 520, 145, 1, { multi: 3, aka: ['Crawling Service'] }),
    n('nosql', 'NoSQL', 'db', 690, 250, 1),
    n('q1', 'Queue', 'queue', 400, 285, 2, { multi: 3, aka: ['Reverse Index Service queue'] }),
    n('q2', 'Queue', 'queue', 600, 360, 2, { multi: 3, aka: ['Document Service queue'] }),
    n('ri', 'Reverse Index\nService', 'app', 400, 470, 2, { multi: 3 }),
    n('doc', 'Document\nService', 'app', 600, 470, 2, { multi: 3 }),
  ],
  edges: [
    e('client', 'web', { until: 3, style: 'dotdash' }),
    e('client', 'dns', { style: 'dotdash' }),
    e('client', 'lb', { style: 'dotdash' }),
    e('lb', 'web', { style: 'dotdash' }),
    e('web', 'query', { style: 'dotdash' }),
    e('query', 'ri', { style: 'dotdash' }),
    e('query', 'doc', { style: 'dotdash', bend: -50 }),
    e('query', 'mc', { style: 'dotdash' }),
    e('crawler', 'q1'),
    e('q1', 'ri'),
    e('crawler', 'q2'),
    e('q2', 'doc'),
    e('crawler', 'nosql'),
  ],
  flows: [
    {
      title: 'Service crawls a list of urls',
      line: 78,
      hops: [
        ['crawler', 'nosql', 88],
        ['crawler', 'q1', 93],
        ['q1', 'ri', 93],
        ['crawler', 'q2', 94],
        ['q2', 'doc', 94],
        ['crawler', 'nosql', 96],
        ['crawler', 'nosql', 97],
      ],
    },
    {
      title: 'User inputs a search term and sees a list of relevant pages with titles and snippets',
      line: 212,
      hops: [
        ['client', 'web', 214],
        ['web', 'query', 215],
        ['query', 'ri', 223],
        ['query', 'doc', 225],
      ],
    },
  ],
  math: [
    { label: 'Stored content per month', formula: '500 KB per page × 4 billion links crawled per month', value: 500 * KB * 4e9, stated: 2 * PB, unit: 'B', line: 55, statedText: '2 PB of stored page content per month', inputs: [45, 44] },
    { label: 'Content in 3 years', formula: '2 PB per month × 36 months', value: 2 * PB * 36, stated: 72 * PB, unit: 'B', line: 57, statedText: '72 PB of stored page content in 3 years', inputs: [55] },
    { label: 'Writes per second', formula: '4 billion pages crawled per month ÷ 2.5 million seconds per month', value: 4e9 / PER_MONTH, stated: 1_600, unit: 'req/s', line: 58, statedText: '1,600 write requests per second', inputs: [44, 63] },
    { label: 'Searches per second', formula: '100 billion searches per month ÷ 2.5 million seconds per month', value: 100e9 / PER_MONTH, stated: 40_000, unit: 'req/s', line: 59, statedText: '40,000 search requests per second', inputs: [47, 63] },
  ],
  additions: [
    { nodes: ['dns'], line: 271, topics: ['domain-name-system'] },
    { nodes: ['lb'], line: 265, topics: ['load-balancer', 'horizontal-scaling'] },
    { nodes: ['mc'], line: 281, topics: ['cache'] },
    { nodes: ['ri', 'doc'], line: 285, topics: ['sharding', 'federation'] },
    { nodes: ['crawler'], line: 286, topics: ['domain-name-system'] },
  ],
  legend: [
    { style: 'dotdash', label: 'User search data flow' },
    { style: 'solid', label: 'Crawler data flow' },
  ],
  notes: ['Step 4 calls it the “Crawling Service” (L283); the diagrams and Step 3 say “Crawler Service”.'],
}
export default builder
