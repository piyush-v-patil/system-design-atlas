/**
 * Visual metadata stays faithful to the source: every quoted claim must appear verbatim (ignoring markdown
 * formatting and whitespace) within the README lines it cites; paraphrases must cite real, non-empty lines.
 */
import { describe, expect, it } from 'vitest'
import { visuals } from '../content/visuals/index.ts'
import type { Claim, TopicVisual } from '../content/visuals/types.ts'
import { topics } from '../src/lib/content.ts'
import { linesText, plain } from '../src/lib/quote.ts'
import { registry } from '../src/visuals/registry.tsx'
import { read } from './helpers/source.ts'

function claimsOf(v: TopicVisual): { where: string; claim: Claim }[] {
  const out: { where: string; claim: Claim }[] = []
  const add = (where: string, c: Claim | null | undefined) => c && out.push({ where, claim: c })
  add('summary', v.summary)
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

  it('quotes the Primer verbatim at the cited lines', () => {
    const problems: string[] = []
    let quoted = 0
    let paraphrased = 0
    for (const v of Object.values(visuals)) {
      for (const { where, claim } of claimsOf(v)) {
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
