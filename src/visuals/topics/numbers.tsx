import { useEffect, useMemo, useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { bulletsAfter } from '../auto.ts'
import { Diagram } from '../kit/svg.tsx'
import { ClaimText, LineRef } from '../kit/Claims.tsx'
import { ModeToggle } from '../kit/Stepper.tsx'
import { q } from '../../../content/visuals/types.ts'

/* ------------------------------------------------------------------ latency numbers */

export interface LatencyRow {
  label: string
  ns: number
  note: string
  line: number
}

/** Rows of the Primer's latency table, parsed verbatim from its code block. */
export function latencyRows(): LatencyRow[] {
  const n = topics.nodes['latency-numbers-every-programmer-should-know']
  const out: LatencyRow[] = []
  n.markdown.split('\n').forEach((l, i) => {
    const m = /^(\S.*?)\s{2,}([\d,]+(?:\.\d+)?)\s+ns(.*)$/.exec(l)
    if (!m) return
    const note = m[3].replace(/[\d,]+\s+us/g, '').replace(/\b\d+\s+ms\b/g, '').replace(/\s+/g, ' ').trim()
    out.push({ label: m[1].trim(), ns: Number(m[2].replace(/,/g, '')), note, line: n.sourceLines[0] + i })
  })
  return out
}

function fmtNs(ns: number) {
  if (ns >= 1e6) return `${(ns / 1e6).toLocaleString()} ms`
  if (ns >= 1e3) return `${(ns / 1e3).toLocaleString()} µs`
  return `${ns} ns`
}
/** "Human scale": 1 ns becomes 1 second. */
function fmtHuman(ns: number) {
  const s = ns
  const units: [number, string][] = [
    [365.25 * 86400, 'years'],
    [30.44 * 86400, 'months'],
    [86400, 'days'],
    [3600, 'hours'],
    [60, 'minutes'],
    [1, 'seconds'],
  ]
  for (const [u, name] of units) if (s >= u) return `${+(s / u).toFixed(s / u < 10 ? 1 : 0)} ${name}`
  return `${s} seconds`
}

export function LatencyChart(_: VisualProps) {
  const rows = useMemo(latencyRows, [])
  const [human, setHuman] = useState(false)
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(t)
  }, [])
  const lo = Math.log10(0.3)
  const hi = Math.log10(2e8)
  const pct = (ns: number) => ((Math.log10(ns) - lo) / (hi - lo)) * 100
  const metrics = bulletsAfter(topics.nodes['latency-numbers-every-programmer-should-know'], 'Handy metrics based on numbers above:')
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ModeToggle
          label="Scale"
          value={human ? 'human' : 'real'}
          onChange={(v) => setHuman(v === 'human')}
          options={[
            { value: 'real', label: 'Real time' },
            { value: 'human', label: 'Scale to human time (1 ns = 1 s)' },
          ]}
        />
        <span className="text-[0.6875rem] text-muted">Log scale: each grid line is ×10</span>
      </div>
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[6rem] left-[40%] hidden sm:block">
          {[1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map((v) => (
            <div key={v} className="absolute inset-y-0 border-l border-dashed border-line" style={{ left: `${pct(v)}%` }} />
          ))}
        </div>
        <ul className="relative flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={r.line} className="grid grid-cols-[1fr] items-center gap-x-2 text-xs sm:grid-cols-[40%_1fr_5.5rem]">
              <span className="truncate" title={r.label}>
                {r.label}
                <LineRef claim={q(`${r.label} ${r.ns.toLocaleString('en-US')} ns`, r.line)} />
              </span>
              <span className="h-3.5 rounded-sm bg-surface-2">
                <span
                  className="block h-3.5 rounded-sm"
                  style={{
                    width: grown ? `${Math.max(1.5, pct(r.ns))}%` : '0%',
                    background: `hsl(${220 - pct(r.ns) * 2} 70% 55%)`,
                    transition: `width 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 40}ms`,
                  }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{human ? fmtHuman(r.ns) : fmtNs(r.ns)}</span>
            </li>
          ))}
        </ul>
      </div>
      {rows.some((r) => r.note) && (
        <p className="text-[0.6875rem] text-muted">Notes from the table: {rows.filter((r) => r.note).map((r) => `${r.label.replace(/\*$/, '')}: ${r.note}`).join(' · ')}</p>
      )}
      <div>
        <div className="mb-1 text-xs font-semibold">Handy metrics based on these numbers</div>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {metrics.map((m, i) => (
            <li key={i} className="rounded-md bg-surface-2/60 px-2 py-1">
              {m.claim.text}
              <LineRef claim={m.claim} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ powers of two */

interface PowRow {
  power: number
  exact: string
  approx: string
  bytes: string
  line: number
}
export function powerRows(): PowRow[] {
  const n = topics.nodes['powers-of-two-table']
  const out: PowRow[] = []
  n.markdown.split('\n').forEach((l, i) => {
    if (!/^\d+\s/.test(l)) return
    const t = l.trim().split(/\s{2,}/)
    const bytes = t.find((x, j) => j > 1 && /^\d+ [KMGT]B$/.test(x)) ?? ''
    const approx = t.find((x, j) => j > 1 && x !== bytes) ?? ''
    out.push({ power: Number(t[0]), exact: t[1], approx, bytes, line: n.sourceLines[0] + i })
  })
  return out
}
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const WORDS: [number, string][] = [
  [1e24, 'septillion'],
  [1e21, 'sextillion'],
  [1e18, 'quintillion'],
  [1e15, 'quadrillion'],
  [1e12, 'trillion'],
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand'],
]

export function PowersOfTwo(_: VisualProps) {
  const rows = useMemo(powerRows, [])
  const [n, setN] = useState(30)
  const exact = (1n << BigInt(n)).toLocaleString('en-US')
  const value = 2 ** n
  const word = WORDS.find(([v]) => value >= v)
  const approx = word ? `≈ ${+(value / word[0]).toPrecision(3)} ${word[1]}` : `${value}`
  const unit = Math.min(UNITS.length - 1, Math.floor(n / 10))
  const bytes = `${2 ** (n - unit * 10)} ${UNITS[unit]}`
  const primer = rows.find((r) => r.power === n)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold">2^</span>
        <input type="range" min={0} max={80} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-48 accent-[var(--accent)]" aria-label="Power of two" />
        <input type="number" min={0} max={80} value={n} onChange={(e) => setN(Math.max(0, Math.min(80, Number(e.target.value) || 0)))} className="w-16 rounded-md border border-line bg-surface px-2 py-1 tabular-nums" aria-label="Power" />
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[0.6875rem] text-muted">Exact value</div>
          <div className="font-mono text-sm font-semibold break-all">{exact}</div>
        </div>
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[0.6875rem] text-muted">Approx value</div>
          <div className="text-sm font-semibold">{approx}</div>
        </div>
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[0.6875rem] text-muted">Bytes (1 KB = 1024 B)</div>
          <div className="text-sm font-semibold">{bytes}</div>
        </div>
      </div>
      {primer && (
        <p className="text-xs text-ok">
          ✓ In the table: {primer.exact}
          {primer.approx && ` · ${primer.approx}`}
          {primer.bytes && ` · ${primer.bytes}`}
          <LineRef claim={q(`${primer.power} ${primer.exact}`, primer.line)} />
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {rows.map((r) => (
          <button key={r.power} onClick={() => setN(r.power)} className={`rounded-full border px-2.5 py-0.5 text-xs tabular-nums ${n === r.power ? 'border-[var(--accent)] bg-accent-soft font-semibold' : 'border-line hover:bg-surface-2'}`}>
            2^{r.power}
          </button>
        ))}
        <span className="self-center text-[0.6875rem] text-muted">rows from the table</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ back-of-the-envelope (the solutions' conversion guide) */

const SECONDS_PER_MONTH = 2.5e6
const SCALE = { thousand: 1e3, million: 1e6, billion: 1e9 } as const
type Scale = keyof typeof SCALE
const SIZE = { B: 1, KB: 1e3, MB: 1e6 } as const
type Size = keyof typeof SIZE

function human(n: number) {
  for (const [v, w] of [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
    [1e3, 'thousand'],
  ] as const)
    if (n >= v) return `${+(n / v).toFixed(n / v < 10 ? 1 : 0)} ${w}`
  return `${+n.toFixed(n < 10 ? 1 : 0)}`
}
function humanBytes(b: number) {
  for (const [v, u] of [
    [1e15, 'PB'],
    [1e12, 'TB'],
    [1e9, 'GB'],
    [1e6, 'MB'],
    [1e3, 'KB'],
  ] as const)
    if (b >= v) return `${+(b / v).toFixed(b / v < 10 ? 1 : 0)} ${u}`
  return `${b} B`
}

export function EnvelopeCalc({ visual }: VisualProps) {
  const [count, setCount] = useState(10)
  const [scale, setScale] = useState<Scale>('million')
  const [size, setSize] = useState(1.27)
  const [unit, setUnit] = useState<Size>('KB')
  const perMonth = count * SCALE[scale]
  const perSecond = perMonth / SECONDS_PER_MONTH
  const bytesMonth = perMonth * size * SIZE[unit]
  const sel = 'rounded-md border border-line bg-surface px-1.5 py-1 text-sm'
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input type="number" min={0} step="any" value={count} onChange={(e) => setCount(Math.max(0, Number(e.target.value)))} className={`${sel} w-24 tabular-nums`} aria-label="Count per month" />
        <select value={scale} onChange={(e) => setScale(e.target.value as Scale)} className={sel} aria-label="Scale">
          {Object.keys(SCALE).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <span>requests (or writes) per month, each</span>
        <input type="number" min={0} step="any" value={size} onChange={(e) => setSize(Math.max(0, Number(e.target.value)))} className={`${sel} w-20 tabular-nums`} aria-label="Size per item" />
        <select value={unit} onChange={(e) => setUnit(e.target.value as Size)} className={sel} aria-label="Size unit">
          {Object.keys(SIZE).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ['Per second (average)', `≈ ${human(perSecond)}`],
          ['New data per month', humanBytes(bytesMonth)],
          ['New data in 3 years', humanBytes(bytesMonth * 36)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line p-2.5">
            <div className="text-[0.6875rem] text-muted">{k}</div>
            <div className="text-lg font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button className="rounded-full border border-line px-2.5 py-1 hover:bg-surface-2" onClick={() => (setCount(10), setScale('million'), setSize(1.27), setUnit('KB'))}>
          Pastebin writes: 10 million/month × 1.27 KB
        </button>
        <button className="rounded-full border border-line px-2.5 py-1 hover:bg-surface-2" onClick={() => (setCount(100), setScale('million'), setSize(1.27), setUnit('KB'))}>
          Pastebin reads: 100 million/month
        </button>
      </div>
      <div className="rounded-lg bg-surface-2/60 p-2.5 text-xs">
        <div className="mb-1 font-semibold">Handy conversion guide (used in every solution)</div>
        <ul className="grid gap-0.5 sm:grid-cols-2">
          {visual.points?.map((c, i) => (
            <li key={i}>
              <ClaimText claim={c} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ performance vs scalability */

/* ------------------------------------------------------------------ latency vs throughput */

export function LatencyThroughputVisual(_: VisualProps) {
  const [lanes, setLanes] = useState(1)
  const LAT = 2 // seconds per item, illustrative
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="rounded-lg bg-bg/60 p-1">
        <Diagram width={560} height={40 + lanes * 40} title="Items moving through workers: latency per item stays the same while throughput grows with more workers">
          {Array.from({ length: lanes }, (_, l) => (
            <g key={l} transform={`translate(0,${24 + l * 40})`}>
              <rect x={60} y={-12} width={440} height={24} rx={12} fill="var(--surface-2)" stroke="var(--border)" />
              <text x={20} y={4} fontSize={10} className="muted">
                lane {l + 1}
              </text>
              {[0, 1].map((k) => (
                <circle key={k} r={8} cy={0} fill="var(--accent)" className="lt-item" style={{ animationDelay: `${k * (LAT / 2) + l * 0.25}s`, animationDuration: `${LAT}s` }} />
              ))}
            </g>
          ))}
        </Diagram>
      </div>
      <label className="flex items-center gap-3 text-sm">
        Parallel workers
        <input type="range" min={1} max={4} value={lanes} onChange={(e) => setLanes(Number(e.target.value))} className="w-40 accent-[var(--accent)]" />
        <span className="tabular-nums">{lanes}</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[0.6875rem] text-muted">Latency (time per item)</div>
          <div className="text-lg font-semibold tabular-nums">{LAT} s</div>
        </div>
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[0.6875rem] text-muted">Throughput (items per second)</div>
          <div className="text-lg font-semibold tabular-nums">{((2 * lanes) / LAT).toFixed(1)}</div>
        </div>
      </div>
      <p className="text-[0.6875rem] text-muted">Times are illustrative. Adding parallel workers raises throughput without changing each item’s latency.</p>
    </div>
  )
}
