/** Search finds every topic by its title and ranks the obvious answer first for common queries. */
import { describe, expect, it } from 'vitest'
import { search, searchIndex } from '../src/search/searchIndex.ts'
import { removedTopicIds, topics } from '../src/lib/content.ts'

describe('search', () => {
  it('indexes every shown topic, problem, OOD problem and term, and nothing removed', () => {
    const idx = searchIndex()
    expect(idx.filter((e) => e.kind === 'topic')).toHaveLength(topics.order.length)
    expect(idx.filter((e) => e.kind === 'problem')).toHaveLength(8)
    expect(idx.filter((e) => e.kind === 'ood')).toHaveLength(6)
    expect(idx.filter((e) => e.kind === 'term').length).toBeGreaterThan(30)
    expect(idx.some((e) => [...removedTopicIds].some((id) => e.to === `/topic/${id}`))).toBe(false)
  })

  it('finds every topic in the top 3 by its own title', () => {
    const misses: string[] = []
    for (const id of topics.order) {
      const n = topics.nodes[id]
      if (n.kind !== 'topic') continue
      const top = search(n.title, 3).map((r) => r.entry.to)
      if (!top.includes(`/topic/${id}`)) misses.push(n.title)
    }
    expect(misses).toEqual([])
  })

  it('ranks common queries sensibly', () => {
    const first = (q: string) => search(q)[0]?.entry
    expect(first('cache')?.to).toBe('/topic/cache')
    expect(first('load balancer')?.to).toBe('/topic/load-balancer')
    expect(first('twitter')?.to).toMatch(/twitter/)
    expect(first('jaccard')?.kind).toBe('term')
    expect(first('parking')?.to).toBe('/ood/parking-lot')
    expect(search('qqqzzz')).toEqual([])
  })

  it('needs every word to match, and shows where a body match is', () => {
    const r = search('heartbeat passive')
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].entry.to).toBe('/topic/active-passive')
    expect(search('sharding')[0].snippet ?? '').toBe('')
  })
})
