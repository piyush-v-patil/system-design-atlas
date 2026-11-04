import { describe, expect, it } from 'vitest'
import { inspect } from './helpers/render.tsx'
import { PATH } from '../src/lib/learningPath.ts'

describe('home page', () => {
  it('lists every topic on the learning path, core and detailed', () => {
    const home = inspect('/')
    const ids = PATH.flatMap((s) => [...s.breadth, ...s.depth])
    const missing = ids.filter((id) => !home.attrs.has(`/topic/${id}`))
    expect(missing).toEqual([])
    expect(home.attrs.has('/topic/study-guide')).toBe(true)
  })
})
