/** Following the learning path: detours keep your place, and "Back to your path" returns to it. */
import { beforeEach, describe, expect, it } from 'vitest'
import { isDetour, visitTopic } from '../src/lib/journey.ts'
import { PATH_ORDER } from '../src/lib/learningPath.ts'
import { getPathCursor, resetProgress } from '../src/lib/progress.ts'

describe('learning path journey', () => {
  beforeEach(() => resetProgress())

  it('moves your place forward one stop at a time', () => {
    visitTopic(PATH_ORDER[0], true)
    visitTopic(PATH_ORDER[1], false)
    visitTopic(PATH_ORDER[2], false)
    expect(getPathCursor()).toBe(PATH_ORDER[2])
  })

  it('keeps your place during a detour and flags it', () => {
    const perf = 'performance-vs-scalability'
    visitTopic(perf, true)
    visitTopic('load-balancer', false)
    expect(getPathCursor()).toBe(perf)
    expect(isDetour('load-balancer', perf)).toBe(true)
    // background pages off the path are detours too
    expect(isDetour('motivation', perf)).toBe(true)
    // the next stop is not a detour
    expect(isDetour(PATH_ORDER[PATH_ORDER.indexOf(perf) + 1], perf)).toBe(false)
  })

  it('a "continue from here" link moves your place', () => {
    visitTopic('performance-vs-scalability', true)
    visitTopic('load-balancer', true)
    expect(getPathCursor()).toBe('load-balancer')
  })
})
