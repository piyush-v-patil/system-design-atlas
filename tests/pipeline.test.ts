/** The content pipeline is lossless: generated JSON reproduces the source files byte-for-byte. */
import { describe, expect, it } from 'vitest'
import { topics, solutions, oods, images } from '../src/lib/content.ts'
import { joinSections } from '../scripts/util/markdown.ts'
import { notebooks, read } from './helpers/source.ts'
import { resolveLink } from '../src/lib/links.ts'

describe('pipeline', () => {
  it('README.md is reproduced byte-for-byte from content/topics.json', () => {
    expect(joinSections(topics)).toBe(read('README.md'))
  })

  it.each(solutions.map((s) => [s.dir, s] as const))('solution %s is reproduced byte-for-byte', (_dir, s) => {
    expect(joinSections(s)).toBe(read(s.source.path))
  })

  it('every notebook cell is kept verbatim', () => {
    for (const nb of notebooks()) {
      const ood = oods.find((o) => o.source.path === nb.path)!
      expect(ood.cells.map((c) => c.source)).toEqual(nb.cells.map((c) => c.source))
    }
  })

  it('links each solution to its own README problem heading', () => {
    for (const s of solutions) {
      expect(topics.nodes[s.readmeTopicId].parentId).toBe('system-design-interview-questions-with-solutions')
      expect(topics.nodes[s.readmeTopicId].urls).toContain(s.source.path)
    }
    expect(new Set(solutions.map((s) => s.readmeTopicId)).size).toBe(8)
  })

  it('keeps the 4-step structure for every solution', () => {
    for (const s of solutions) expect(s.steps.map((x) => x.step)).toEqual([1, 2, 3, 4, 5])
  })

  it('every in-README #anchor resolves to a topic route', () => {
    const anchors = [...read('README.md').matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1])
    expect(anchors.length).toBeGreaterThan(80)
    for (const a of anchors) expect(resolveLink(`#${a}`, 'README.md')).toMatchObject({ kind: 'route', to: `/topic/${a}` })
  })

  it('links from solutions back into the Primer become topic routes', () => {
    expect(resolveLink('https://github.com/donnemartin/system-design-primer#cap-theorem', 'x')).toMatchObject({ kind: 'route', to: '/topic/cap-theorem' })
    expect(resolveLink('../scaling_aws/README.md', 'solutions/system_design/pastebin/README.md')).toMatchObject({ kind: 'route', to: '/solutions/scaling-aws' })
    expect(resolveLink('CONTRIBUTING.md', 'README.md')).toMatchObject({ kind: 'external' })
  })

  it('only the two scaling_aws drafts are unreferenced', () => {
    expect(images.unreferenced).toEqual(['images/solutions/scaling_aws/scaling_aws.png', 'images/solutions/scaling_aws/scaling_aws_6.png'])
  })
})
