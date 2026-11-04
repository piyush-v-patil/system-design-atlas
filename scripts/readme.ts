import type { Area, NodeKind, SourceRef, TopicNode, TopicsFile } from '../src/lib/types.ts'
import { splitSections } from './util/markdown.ts'

/** Area per H2 heading title (docs/PLAN.md §2; "guide" for meta sections, decision D2; app layer → networking, D3). */
const AREA_BY_H2: Record<string, Area> = {
  'System design topics: start here': 'fundamentals',
  'Performance vs scalability': 'fundamentals',
  'Latency vs throughput': 'fundamentals',
  'Availability vs consistency': 'fundamentals',
  'Consistency patterns': 'fundamentals',
  'Availability patterns': 'fundamentals',
  'Domain name system': 'networking',
  'Content delivery network': 'networking',
  'Load balancer': 'networking',
  'Reverse proxy (web server)': 'networking',
  'Application layer': 'networking',
  Database: 'data',
  Cache: 'caching',
  Asynchronism: 'async',
  Communication: 'communication',
  Security: 'security',
  Appendix: 'appendix',
  'Under development': 'appendix',
}

export function kindOf(title: string): NodeKind {
  if (/^Disadvantage\(s\)/.test(title)) return 'disadvantages'
  if (/^Source\(s\) and further reading/.test(title)) return 'sources'
  return 'topic'
}

export function buildTopics(src: string, source: SourceRef): TopicsFile {
  const doc = splitSections(src, source)
  const nodes: Record<string, TopicNode> = {}
  for (const id of doc.order) {
    const n = doc.nodes[id]
    const h2Title = n.level === 0 ? null : doc.nodes[n.pathIds[1]].title
    const area: Area = h2Title ? (AREA_BY_H2[h2Title] ?? 'guide') : 'guide'
    nodes[id] = { ...n, area, kind: kindOf(n.title) }
  }
  return { ...doc, nodes }
}
