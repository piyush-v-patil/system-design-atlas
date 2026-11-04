/**
 * Visual metadata stays faithful to the source: every quoted claim must appear verbatim (ignoring markdown
 * formatting and whitespace) within the README lines it cites; paraphrases must cite real, non-empty lines.
 */
import { describe, expect, it } from 'vitest'
import { getVisual, visuals } from '../content/visuals/index.ts'
import { PATH_STAGES, TIMELINES, NOT_EVERYTHING, START_BROAD } from '../content/visuals/_shared/path.ts'
import { bullets, links, paragraphs, table } from '../src/visuals/auto.ts'
import { latencyRows, powerRows } from '../src/visuals/topics/numbers.tsx'
import { parseStudyGuide } from '../src/visuals/topics/path.tsx'
import { PATH, PATH_ORDER } from '../src/lib/learningPath.ts'
import type { Claim, TopicVisual } from '../content/visuals/types.ts'
import { topics } from '../src/lib/content.ts'
import { linesText, plain } from '../src/lib/quote.ts'
import { registry } from '../src/visuals/registry.tsx'
import { read } from './helpers/source.ts'

function claimsOf(v: TopicVisual): { where: string; claim: Claim }[] {
  const out: { where: string; claim: Claim }[] = []
  const add = (where: string, c: Claim | null | undefined) => c && out.push({ where, claim: c })
  add('summary', v.summary)
  v.points?.forEach((c, i) => add(`points[${i}]`, c))
  v.tiles?.forEach((t, i) => add(`tiles[${i}]`, t.claim))
  add('useWhen', v.useWhen)
  v.pros?.forEach((c, i) => add(`pros[${i}]`, c))
  v.cons?.forEach((c, i) => add(`cons[${i}]`, c))
  v.steps?.forEach((s, i) => add(`steps[${i}]`, s.source))
  Object.entries(v.stepsByMode ?? {}).forEach(([m, ss]) => ss.forEach((s, i) => add(`stepsByMode.${m}[${i}]`, s.source)))
  v.comparison?.rows.forEach((r) => Object.entries(r.cells).forEach(([k, c]) => add(`comparison "${r.label}".${k}`, c)))
  Object.entries(v.comparison?.chooseWhen ?? {}).forEach(([k, c]) => add(`chooseWhen.${k}`, c))
  return out
}

/** Phase 2 scope from the brief. */
const PHASE2 = [
  'cap-theorem',
  'cp---consistency-and-partition-tolerance',
  'ap---availability-and-partition-tolerance',
  'consistency-patterns',
  'weak-consistency',
  'eventual-consistency',
  'strong-consistency',
  'availability-patterns',
  'fail-over',
  'active-passive',
  'active-active',
  'replication',
  'availability-in-numbers',
  'in-sequence',
  'in-parallel',
  'load-balancer',
  'layer-4-load-balancing',
  'layer-7-load-balancing',
  'master-slave-replication',
  'master-master-replication',
  'federation',
  'sharding',
  'when-to-update-the-cache',
  'cache-aside',
  'write-through',
  'write-behind-write-back',
  'refresh-ahead',
]

const docs = new Map<string, string>()
const doc = (path: string) => {
  if (!docs.has(path)) docs.set(path, read(path))
  return docs.get(path)!
}

describe('visual metadata', () => {
  it('covers every Phase 2 topic with a component', () => {
    const missing = PHASE2.filter((id) => !visuals[id]?.component)
    expect(missing).toEqual([])
  })

  it('references real topics and registered components', () => {
    const problems: string[] = []
    for (const v of Object.values(visuals)) {
      if (!topics.nodes[v.topicId]) problems.push(`${v.topicId}: no such topic`)
      if (v.component && !registry[v.component]) problems.push(`${v.topicId}: unknown component ${v.component}`)
      for (const r of v.related ?? []) if (!topics.nodes[r]) problems.push(`${v.topicId}: related "${r}" is not a topic`)
      const mode = v.props?.mode as string | undefined
      if (mode && v.stepsByMode && !v.stepsByMode[mode]) problems.push(`${v.topicId}: no steps for mode ${mode}`)
      const col = v.props?.activeColumn as string | undefined
      if (col && v.comparison && !v.comparison.columns.some((c) => c.key === col)) problems.push(`${v.topicId}: no column ${col}`)
    }
    expect(problems).toEqual([])
  })

  it('gives every topic a visual card', () => {
    const missing = topics.order.filter((id) => {
      const v = getVisual(id)
      return !v || !(v.component || v.comparison || v.tiles?.length)
    })
    expect(missing).toEqual([])
  })

  it('quotes the Primer verbatim at the cited lines', () => {
    const problems: string[] = []
    let quoted = 0
    let paraphrased = 0
    const extra: { topicId: string; where: string; claim: Claim }[] = [
      ...PATH_STAGES.map((s) => ({ topicId: 'path', where: `stage ${s.id}`, claim: s.why })),
      ...Object.entries(TIMELINES).map(([k, t]) => ({ topicId: 'path', where: `timeline ${k}`, claim: t.claim })),
      { topicId: 'path', where: 'not-everything', claim: NOT_EVERYTHING },
      { topicId: 'path', where: 'start-broad', claim: START_BROAD },
    ]
    const groups: { topicId: string; items: { where: string; claim: Claim }[] }[] = [
      ...Object.values(visuals).map((v) => ({ topicId: v.topicId, items: claimsOf(v) })),
      ...extra.map((e) => ({ topicId: e.topicId, items: [{ where: e.where, claim: e.claim }] })),
    ]
    for (const { topicId, items } of groups) {
      const v = { topicId }
      for (const { where, claim } of items) {
        const path = claim.doc ?? 'README.md'
        const text = doc(path)
        const total = text.split('\n').length
        const [a, b] = claim.lines
        const label = `${v.topicId} ${where} (${path}:${a}${a === b ? '' : `-${b}`})`
        if (a < 1 || b < a || b > total) {
          problems.push(`${label}: line range out of bounds`)
          continue
        }
        const cited = linesText(text, claim.lines)
        if (claim.basis === 'quoted') {
          quoted++
          if (!cited.includes(plain(claim.text))) problems.push(`${label}: "${claim.text}" not found in: "${cited.slice(0, 160)}…"`)
        } else {
          paraphrased++
          if (cited.length === 0) problems.push(`${label}: cites blank lines`)
          if (claim.text.trim().length === 0) problems.push(`${label}: empty paraphrase`)
        }
      }
    }
    if (problems.length) process.stdout.write('\n' + problems.map((p) => `  ✘ ${p}`).join('\n') + '\n')
    process.stdout.write(`\nVisual claims: ${quoted} quoted (verified verbatim), ${paraphrased} paraphrased (marked ≈ in the UI)\n`)
    expect(problems).toEqual([])
  })
})

describe('visuals derived from the source text', () => {
  it('auto-extracted bullets, paragraphs and links are verbatim at their lines', () => {
    const readme = read('README.md')
    const problems: string[] = []
    let n = 0
    for (const id of topics.order) {
      const node = topics.nodes[id]
      for (const c of [...bullets(node).map((b) => b.claim), ...paragraphs(node)]) {
        n++
        if (!linesText(readme, c.lines).includes(plain(c.text))) problems.push(`${id} L${c.lines[0]}: ${c.text}`)
      }
      for (const l of links(node)) {
        n++
        if (!readme.split('\n')[l.line - 1].includes(l.url)) problems.push(`${id} L${l.line}: link ${l.url}`)
      }
    }
    process.stdout.write(`Auto-derived claims checked: ${n}\n`)
    expect(problems).toEqual([])
  })

  it('parses the latency table exactly (15 rows)', () => {
    const rows = latencyRows()
    expect(rows).toHaveLength(15)
    expect(rows[0]).toMatchObject({ label: 'L1 cache reference', ns: 0.5 })
    expect(rows.find((r) => r.label === 'HDD seek')?.ns).toBe(10_000_000)
    expect(rows.at(-1)).toMatchObject({ label: 'Send packet CA->Netherlands->CA', ns: 150_000_000 })
    const readme = read('README.md').split('\n')
    for (const r of rows) expect(readme[r.line - 1]).toContain(r.label)
  })

  it('parses the powers-of-two table exactly (8 rows)', () => {
    const rows = powerRows()
    expect(rows.map((r) => r.power)).toEqual([7, 8, 10, 16, 20, 30, 32, 40])
    for (const r of rows) expect(r.exact.replace(/,/g, '')).toBe((2n ** BigInt(r.power)).toString())
    expect(rows.find((r) => r.power === 16)?.bytes).toBe('64 KB')
    expect(rows.find((r) => r.power === 10)?.approx).toBe('1 thousand')
  })

  it('parses the study guide table (7 rows, timelines intact)', () => {
    const rows = parseStudyGuide()
    expect(rows).toHaveLength(7)
    expect(rows.map((r) => r.values.short)).toEqual(['✓', '✓', '✓', '✓', 'Some', 'Some', 'Some'])
    expect(rows.map((r) => r.values.long)).toEqual(['✓', '✓', '✓', '✓', 'Most', 'Most', 'Most'])
  })

  it('every source table used by a visual parses', () => {
    for (const id of ['hypertext-transfer-protocol-http', 'rpc-and-rest-calls-comparison', 'additional-system-design-interview-questions', 'real-world-architectures', 'company-architectures']) {
      const t = table(topics.nodes[id])
      expect(t, id).not.toBeNull()
      expect(t!.rows.length, id).toBeGreaterThan(2)
    }
  })
})

describe('learning path', () => {
  it('covers every non-satellite topic outside the meta sections, once, in a sensible order', () => {
    const onPath = new Set(PATH_ORDER)
    expect(onPath.size).toBe(PATH_ORDER.length)
    const content = topics.order.filter((id) => {
      const n = topics.nodes[id]
      return n.kind === 'topic' && ['fundamentals', 'networking', 'data', 'caching', 'async', 'communication', 'security', 'appendix'].includes(n.area)
    })
    expect(content.filter((id) => !onPath.has(id))).toEqual([])
    // Stage order follows the Primer: trade-offs before DNS/CDN/LB, before databases, before caching…
    expect(PATH.map((s) => s.id)).toEqual(['start', 'tradeoffs', 'traffic', 'data', 'cache', 'async', 'communication', 'security', 'numbers', 'practice'])
  })
})
