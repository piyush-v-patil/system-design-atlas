/**
 * Availability maths from the Primer (README "Availability in numbers"):
 *   in sequence:  A = A(foo) * A(bar)
 *   in parallel:  A = 1 - (1 - A(foo)) * (1 - A(bar))
 * Downtime uses a 365.2425-day (Gregorian) year and month = year / 12, which reproduces the Primer's tables
 * (e.g. 99.9% → 8h 45min 57s per year, 43m 49.7s per month). See tests/availability.test.ts.
 */

export type AvItem =
  | { id: string; kind: 'component'; name: string; pct: number }
  | { id: string; kind: 'group'; mode: 'series' | 'parallel'; children: AvItem[] }
export type AvGroup = Extract<AvItem, { kind: 'group' }>

export function combine(item: AvItem): number {
  if (item.kind === 'component') return Math.min(1, Math.max(0, item.pct / 100))
  if (item.children.length === 0) return 1
  const parts = item.children.map(combine)
  return item.mode === 'series' ? parts.reduce((a, b) => a * b, 1) : 1 - parts.reduce((a, b) => a * (1 - b), 1)
}

export const DAY = 86_400
export const WEEK = 7 * DAY
export const YEAR = 365.2425 * DAY
export const MONTH = YEAR / 12

export function downtime(a: number) {
  const u = 1 - a
  return { year: u * YEAR, month: u * MONTH, week: u * WEEK, day: u * DAY }
}

/** "number of nines", e.g. 0.999 → 3. */
export const nines = (a: number) => (a >= 1 ? Infinity : -Math.log10(1 - a))

/** Format seconds as d h m s with one decimal on seconds, e.g. 31556.95 → "8h 45m 57.0s". */
export function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '0s'
  let s = Math.round(sec * 10) / 10
  const d = Math.floor(s / DAY)
  s -= d * DAY
  const h = Math.floor(s / 3600)
  s -= h * 3600
  const m = Math.floor(s / 60)
  s = Math.round((s - m * 60) * 10) / 10
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (d || h) parts.push(`${h}h`)
  if (d || h || m) parts.push(`${m}m`)
  parts.push(`${s.toFixed(1)}s`)
  return parts.join(' ')
}

/** Parse the Primer's duration strings ("8h 45min 57s", "43m 49.7s", "8.6s") into seconds. */
export function parseDuration(text: string): number {
  let total = 0
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(h|min|m|s)\b/g)) {
    const v = Number(m[1])
    total += m[2] === 'h' ? v * 3600 : m[2] === 's' ? v : v * 60
  }
  return total
}

/** Rows of a Primer downtime table: "| Downtime per year   | 8h 45min 57s       |". */
export function parseDowntimeTable(markdown: string): { period: 'year' | 'month' | 'week' | 'day'; text: string; seconds: number }[] {
  return [...markdown.matchAll(/^\|\s*Downtime per (year|month|week|day)\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => ({
    period: m[1] as 'year' | 'month' | 'week' | 'day',
    text: m[2],
    seconds: parseDuration(m[2]),
  }))
}

/** Percent with up to `max` decimals, trailing zeros trimmed: 0.998001 → "99.8001%". */
export function formatPct(a: number, max = 6): string {
  return `${(a * 100).toFixed(max).replace(/\.?0+$/, '')}%`
}

let seq = 0
export const uid = () => `av${++seq}`
export const comp = (name: string, pct: number): AvItem => ({ id: uid(), kind: 'component', name, pct })
export const group = (mode: 'series' | 'parallel', children: AvItem[]): AvGroup => ({ id: uid(), kind: 'group', mode, children })

export const PRESETS: Record<string, { label: string; build: () => AvGroup; example?: boolean }> = {
  series: { label: 'Primer: Foo and Bar in sequence', build: () => group('series', [comp('Foo', 99.9), comp('Bar', 99.9)]) },
  parallel: { label: 'Primer: Foo and Bar in parallel', build: () => group('parallel', [comp('Foo', 99.9), comp('Bar', 99.9)]) },
  three: { label: 'Primer: three 9s', build: () => group('series', [comp('Service', 99.9)]) },
  four: { label: 'Primer: four 9s', build: () => group('series', [comp('Service', 99.99)]) },
  stack: {
    label: 'Web stack (example values)',
    example: true,
    build: () =>
      group('series', [
        group('parallel', [comp('LB 1', 99.9), comp('LB 2', 99.9)]),
        group('parallel', [comp('Web 1', 99.5), comp('Web 2', 99.5), comp('Web 3', 99.5)]),
        comp('Database', 99.95),
      ]),
  },
}
