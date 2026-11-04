/**
 * The architecture builders stay faithful to the solution READMEs: every node, edge, hop and addition references
 * real components; every quoted line exists and names a component of its hop; the arithmetic matches what the
 * Primer states; every solution image is reproduced by a frame; and no two boxes overlap.
 */
import { describe, expect, it } from 'vitest'
import { builders } from '../content/builders/index.ts'
import type { BNode, Builder } from '../content/builders/types.ts'
import { images, solutions, sourceText, topics } from '../src/lib/content.ts'
import { lineQuote, linesText, plain } from '../src/lib/quote.ts'
import { boxOf, edgeVisibleAt, firstFrameOfStep, flatLabel, labelAt, visibleAt } from '../src/solutions/geometry.ts'
import { read } from './helpers/source.ts'

const names = (n: BNode) => [n.label, n.relabel?.label, ...(n.aka ?? [])].filter(Boolean).map((s) => flatLabel(s!).toLowerCase())

function check(b: Builder): string[] {
  const out: string[] = []
  const sol = solutions.find((s) => s.id === b.solutionId)!
  const src = read(sol.source.path)
  const lines = src.split('\n')
  const byId = new Map(b.nodes.map((n) => [n.id, n]))
  const node = (id: string, where: string) => {
    const n = byId.get(id)
    if (!n) out.push(`${where}: unknown node ${id}`)
    return n
  }
  const lineOk = (l: number, where: string) => {
    if (l < 1 || l > lines.length || !lines[l - 1].trim()) {
      out.push(`${where}: line ${l} is blank or out of range`)
      return false
    }
    return true
  }
  const mentions = (l: number, ns: (BNode | undefined)[]) => {
    const text = plain(lines[l - 1]).toLowerCase()
    return ns.some((n) => n && names(n).some((x) => text.includes(x)))
  }
  const last = b.frames.length - 1

  // frames
  const steps = b.frames.map((f) => f.step)
  if (steps.join() !== [...steps].sort().join() || [1, 2, 3, 4].some((s) => !steps.includes(s as 1))) out.push(`frames out of order: ${steps}`)
  for (const [i, f] of b.frames.entries()) {
    if (f.sectionTitle && !Object.values(sol.nodes).some((n) => n.title === f.sectionTitle)) out.push(`frame ${i}: no section "${f.sectionTitle}"`)
    for (const l of f.lines ?? []) lineOk(l, `frame ${i}`)
    if (f.image && !src.includes(`](${f.image})`)) out.push(`frame ${i}: image ${f.image} is not in ${sol.source.path}`)
  }
  // every image the solution shows is reproduced by some frame
  for (const m of src.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) if (!b.frames.some((f) => f.image === m[1])) out.push(`image ${m[1]} has no frame`)

  // nodes
  if (new Set(b.nodes.map((n) => n.id)).size !== b.nodes.length) out.push('duplicate node ids')
  for (const n of b.nodes) {
    const bx = boxOf(n)
    if (bx.x0 < 0 || bx.y0 < 0 || bx.x1 > b.width || bx.y1 > b.height) out.push(`${n.id} is outside the canvas`)
  }
  for (let f = 0; f <= last; f++) {
    const vis = b.nodes.filter((n) => visibleAt(n, f))
    for (let i = 0; i < vis.length; i++)
      for (let j = i + 1; j < vis.length; j++) {
        const p = boxOf(vis[i], 4)
        const q = boxOf(vis[j], 4)
        if (p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1) out.push(`frame ${f}: ${vis[i].id} overlaps ${vis[j].id}`)
      }
  }
  // edges
  for (const e of b.edges) {
    const a = node(e.a, 'edge')
    const z = node(e.b, 'edge')
    if (!a || !z) continue
    for (let f = 0; f <= last; f++) if (edgeVisibleAt(b, e, f) && !(visibleAt(a, f) && visibleAt(z, f))) out.push(`edge ${e.a}→${e.b} drawn at frame ${f} without both ends`)
  }
  // groups
  for (const g of b.groups ?? []) {
    for (const id of g.nodes) {
      const n = node(id, `group ${g.id}`)
      if (n && !(visibleAt(n, g.from) && visibleAt(n, (g.until ?? last + 1) - 1))) out.push(`group ${g.id}: ${id} is not visible throughout`)
    }
    for (const t of g.linkTo ?? []) if (!b.groups!.some((x) => x.id === t)) out.push(`group ${g.id}: unknown link ${t}`)
  }
  // flows
  const step3 = firstFrameOfStep(b, 3)
  for (const fl of b.flows) {
    const f = fl.frame ?? step3
    if (!lines[fl.line - 1]?.includes(fl.title.replace(/\.$/, '')) && !lineOk(fl.line, `flow "${fl.title}"`)) continue
    for (const [a, z, l] of fl.hops) {
      const na = node(a, `flow "${fl.title}"`)
      const nz = node(z, `flow "${fl.title}"`)
      if (!lineOk(l, `hop ${a}→${z}`)) continue
      if (!mentions(l, [na, nz])) out.push(`hop ${a}→${z} L${l} names neither component: "${lines[l - 1].trim()}"`)
      for (const n of [na, nz]) if (n && !visibleAt(n, f)) out.push(`hop ${a}→${z}: ${n.id} not visible at frame ${f}`)
      if (!plain(lines[l - 1]).includes(plain(lineQuote(src, l)))) out.push(`hop L${l}: display text is not verbatim`)
    }
  }
  // math
  for (const m of b.math) {
    const err = Math.abs(m.value - m.stated) / m.stated
    if (err > 0.06) out.push(`math "${m.label}": computed ${m.value}, Primer states ${m.stated}`)
    if (!lineOk(m.line, `math "${m.label}"`)) continue
    if (!linesText(src, [m.line, m.line]).includes(plain(m.statedText))) out.push(`math "${m.label}": L${m.line} does not say "${m.statedText}"`)
    for (const l of m.inputs) lineOk(l, `math "${m.label}" input`)
  }
  // additions
  for (const ad of b.additions) {
    const f = ad.frame ?? last
    const ns = ad.nodes.map((id) => node(id, `addition L${ad.line}`))
    if (!lineOk(ad.line, `addition ${ad.nodes}`)) continue
    if (!mentions(ad.line, ns)) out.push(`addition ${ad.nodes} L${ad.line} names none of its components`)
    for (const n of ns) if (n && !visibleAt(n, f)) out.push(`addition ${n.id} not visible at frame ${f}`)
    for (const t of ad.topics) if (!topics.nodes[t]) out.push(`addition ${ad.nodes}: unknown topic ${t}`)
  }
  for (const [i, fr] of b.frames.entries()) {
    if (fr.step !== 4) continue
    for (const n of b.nodes.filter((x) => x.from === i))
      if (!b.additions.some((ad) => (ad.frame ?? last) === i && ad.nodes.includes(n.id))) out.push(`${n.id} appears at frame ${i} with no explanation`)
  }
  // node labels at the final frame are what the final diagram shows
  for (const n of b.nodes) if (!labelAt(n, last).trim()) out.push(`${n.id} has an empty label`)
  return out
}

describe('architecture builders', () => {
  it('exist for all 8 system design solutions', () => {
    expect(Object.keys(builders).sort()).toEqual(solutions.map((s) => s.id).sort())
  })

  it.each(solutions.map((s) => [s.id] as const))('%s is consistent with its README', (id) => {
    const problems = check(builders[id])
    if (problems.length) process.stdout.write(`\n${id}:\n` + problems.map((p) => `  ✘ ${p}`).join('\n') + '\n')
    expect(problems).toEqual([])
  })

  it('reproduces every solution image', () => {
    const used = new Set(Object.values(builders).flatMap((b) => b.frames.map((f) => f.image).filter(Boolean)))
    const solutionImages = Object.keys(images.entries).filter((k) => images.entries[k].referencedIn.some((r) => r.startsWith('solutions/system_design/')))
    expect(solutionImages.filter((k) => !used.has(k))).toEqual([])
  })

  it('sourceText matches the files', () => {
    for (const s of solutions) expect(sourceText(s)).toBe(read(s.source.path))
  })

  it('counts', () => {
    const all = Object.values(builders)
    const hops = all.reduce((n, b) => n + b.flows.reduce((m, f) => m + f.hops.length, 0), 0)
    process.stdout.write(
      `\nBuilders: ${all.length}, frames ${all.reduce((n, b) => n + b.frames.length, 0)}, nodes ${all.reduce((n, b) => n + b.nodes.length, 0)}, ` +
        `edges ${all.reduce((n, b) => n + b.edges.length, 0)}, hops ${hops}, math checks ${all.reduce((n, b) => n + b.math.length, 0)}\n`,
    )
    expect(hops).toBeGreaterThan(50)
  })
})
