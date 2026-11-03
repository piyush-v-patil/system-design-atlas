/** The availability calculator reproduces the Primer's numbers (README "Availability in numbers"). */
import { describe, expect, it } from 'vitest'
import { topics } from '../src/lib/content.ts'
import { combine, comp, downtime, formatDuration, formatPct, group, parseDowntimeTable, parseDuration, PRESETS } from '../src/visuals/tools/availability.ts'
import { movedUsers } from '../src/visuals/topics/partitioning.tsx'

describe('availability maths', () => {
  it('matches the in-sequence and in-parallel examples', () => {
    const series = combine(PRESETS.series.build())
    const parallel = combine(PRESETS.parallel.build())
    expect(series).toBeCloseTo(0.998001, 12)
    expect(parallel).toBeCloseTo(0.999999, 12)
    // The Primer rounds these to "99.8%" and "99.9999%".
    expect(Number((series * 100).toFixed(1))).toBe(99.8)
    expect(formatPct(parallel)).toBe('99.9999%')
  })

  it('nests groups', () => {
    const g = group('series', [group('parallel', [comp('a', 90), comp('b', 90)]), comp('c', 50)])
    expect(combine(g)).toBeCloseTo(0.99 * 0.5, 12)
  })

  it('reproduces the 99.9% and 99.99% tables, except the one cell flagged as F1', () => {
    const mismatches: string[] = []
    let checked = 0
    for (const [id, a] of [
      ['999-availability---three-9s', 0.999],
      ['9999-availability---four-9s', 0.9999],
    ] as const) {
      const rows = parseDowntimeTable(topics.nodes[id].markdown)
      expect(rows.map((r) => r.period)).toEqual(['year', 'month', 'week', 'day'])
      const dt = downtime(a)
      for (const r of rows) {
        checked++
        if (Math.abs(r.seconds - dt[r.period]) > 0.6) mismatches.push(`${a} ${r.period}: Primer "${r.text}" vs computed ${formatDuration(dt[r.period])}`)
      }
    }
    expect(checked).toBe(8)
    expect(mismatches).toEqual(['0.9999 week: Primer "1m 5s" vs computed 1m 0.5s'])
  })

  it('parses and formats durations', () => {
    expect(parseDuration('8h 45min 57s')).toBe(31557)
    expect(parseDuration('43m 49.7s')).toBeCloseTo(2629.7, 6)
    expect(parseDuration('8.6s')).toBe(8.6)
    expect(formatDuration(downtime(0.999).year)).toBe('8h 45m 57.0s')
    expect(formatDuration(downtime(0.9999).day)).toBe('8.6s')
    expect(formatDuration(0)).toBe('0s')
  })
})

describe('sharding visual', () => {
  it('moves some, but not all, users when a shard is added', () => {
    for (const by of ['initial', 'geo'] as const) {
      const n = movedUsers(by).length
      expect(n).toBeGreaterThan(0)
      expect(n).toBeLessThan(15)
    }
  })
})
