/** Every glossary entry explains a link that actually appears in the shown text, and stays short. */
import { describe, expect, it } from 'vitest'
import { GLOSSARY } from '../content/glossary.ts'
import { solutions, topics } from '../src/lib/content.ts'

describe('glossary', () => {
  const shown = [...topics.order.map((id) => topics.nodes[id].markdown), ...solutions.map((s) => s.order.map((id) => s.nodes[id].markdown).join('\n'))].join('\n')
  it('every entry matches a link in the text', () => {
    expect(Object.keys(GLOSSARY).filter((url) => !shown.includes(`](${url})`))).toEqual([])
  })
  it('every entry is at most two short paragraphs', () => {
    for (const [url, e] of Object.entries(GLOSSARY)) {
      expect(e.text.length, url).toBeLessThanOrEqual(2)
      for (const t of e.text) expect(t.split(/\s+/).length, url).toBeLessThan(80)
    }
  })
})
