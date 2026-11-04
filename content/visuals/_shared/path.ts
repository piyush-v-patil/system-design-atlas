import { q, type Claim } from '../types.ts'

/**
 * The learning path follows the Primer's own guidance:
 * - "System design topics: start here" (README 372–410): the lecture and article first, then "high-level trade-offs",
 *   "Then we'll dive into more specific topics such as DNS, CDNs, and load balancers", then the index order.
 * - "Study guide" (README 182–216): read the topics for breadth, then practice; the timeline sets how much depth.
 * Each stage lists the Primer sections (H2 ids) it covers; topics inside come from the heading tree.
 */
export interface PathStageDef {
  id: string
  title: string
  /** The Primer's own words for why this comes now. */
  why: Claim
  /** Sections (H2 topic ids) this stage covers, or explicit topic ids for the start/practice stages. */
  sections: string[]
}

export const PATH_STAGES: PathStageDef[] = [
  {
    id: 'start',
    title: 'Start here',
    why: q("First, you'll need a basic understanding of common principles, learning about what they are, how they are used, and their pros and cons.", 376),
    sections: ['system-design-topics-start-here'],
  },
  {
    id: 'tradeoffs',
    title: 'High-level trade-offs',
    why: q("Next, we'll look at high-level trade-offs:", 402),
    sections: ['performance-vs-scalability', 'latency-vs-throughput', 'availability-vs-consistency', 'consistency-patterns', 'availability-patterns'],
  },
  {
    id: 'traffic',
    title: 'DNS, CDNs and load balancers',
    why: q("Then we'll dive into more specific topics such as DNS, CDNs, and load balancers.", 410),
    sections: ['domain-name-system', 'content-delivery-network', 'load-balancer', 'reverse-proxy-web-server', 'application-layer'],
  },
  {
    id: 'data',
    title: 'Databases',
    why: q('There are many techniques to scale a relational database: master-slave replication, master-master replication, federation, sharding, denormalization, and SQL tuning.', 827),
    sections: ['database'],
  },
  {
    id: 'cache',
    title: 'Caching',
    why: q('Caching improves page load times and can reduce the load on your servers and databases.', 1140),
    sections: ['cache'],
  },
  {
    id: 'async',
    title: 'Asynchronism',
    why: q('Asynchronous workflows help reduce request times for expensive operations that would otherwise be performed in-line.', 1332),
    sections: ['asynchronism'],
  },
  {
    id: 'communication',
    title: 'Communication',
    why: q('HTTP is an application layer protocol relying on lower-level protocols such as TCP and UDP.', 1394),
    sections: ['communication'],
  },
  {
    id: 'security',
    title: 'Security',
    why: q(
      "Unless you have considerable experience, a security background, or are applying for a position that requires knowledge of security, you probably won't need to know more than the basics:",
      1564,
    ),
    sections: ['security'],
  },
  {
    id: 'numbers',
    title: 'Numbers for estimates',
    why: q("You'll sometimes be asked to do 'back-of-the-envelope' estimates.", 1579),
    sections: ['appendix'],
  },
  {
    id: 'practice',
    title: 'Practice interviews',
    why: q('Practice common system design interview questions and compare your results with sample solutions: discussions, code, and diagrams.', 36),
    sections: [
      'how-to-approach-a-system-design-interview-question',
      'system-design-interview-questions-with-solutions',
      'object-oriented-design-interview-questions-with-solutions',
      'additional-system-design-interview-questions',
      'real-world-architectures',
      'company-architectures',
      'company-engineering-blogs',
    ],
  },
]

/** Appendix topics that belong to "practice" rather than "numbers". */
export const PRACTICE_FROM_APPENDIX = ['additional-system-design-interview-questions', 'real-world-architectures', 'company-architectures', 'company-engineering-blogs']

export type Timeline = 'short' | 'medium' | 'long'

/** The study guide's three timelines (README 204–206). */
export const TIMELINES: Record<Timeline, { label: string; claim: Claim }> = {
  short: { label: 'Short timeline', claim: q('Short timeline - Aim for breadth with system design topics. Practice by solving some interview questions.', 204) },
  medium: { label: 'Medium timeline', claim: q('Medium timeline - Aim for breadth and some depth with system design topics. Practice by solving many interview questions.', 205) },
  long: { label: 'Long timeline', claim: q('Long timeline - Aim for breadth and more depth with system design topics. Practice by solving most interview questions.', 206) },
}

export const START_BROAD = q('Start broad and go deeper in a few areas. It helps to know a little about various key system design topics.', 202)
export const NOT_EVERYTHING = q("A: No, you don't need to know everything here to prepare for the interview.", 190)
