import { useEffect, useMemo, useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { bulletsAfter } from '../auto.ts'
import { Diagram } from '../kit/svg.tsx'
import { ClaimText, LineRef } from '../kit/Claims.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { q, type ProcessStep } from '../../../content/visuals/types.ts'

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
        <span className="text-[11px] text-muted">Log scale: each grid line is ×10</span>
      </div>
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[96px] left-[40%] hidden sm:block">
          {[1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map((v) => (
            <div key={v} className="absolute inset-y-0 border-l border-dashed border-line" style={{ left: `${pct(v)}%` }} />
          ))}
        </div>
        <ul className="relative flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={r.line} className="grid grid-cols-[1fr] items-center gap-x-2 text-xs sm:grid-cols-[40%_1fr_88px]">
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
        <p className="text-[11px] text-muted">Notes from the table: {rows.filter((r) => r.note).map((r) => `${r.label.replace(/\*$/, '')}: ${r.note}`).join(' · ')}</p>
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
          <div className="text-[11px] text-muted">Exact value</div>
          <div className="font-mono text-sm font-semibold break-all">{exact}</div>
        </div>
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[11px] text-muted">Approx value</div>
          <div className="text-sm font-semibold">{approx}</div>
        </div>
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[11px] text-muted">Bytes (1 KB = 1024 B)</div>
          <div className="text-sm font-semibold">{bytes}</div>
        </div>
      </div>
      {primer && (
        <p className="text-xs text-ok">
          ✓ In the Primer’s table: {primer.exact}
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
        <span className="self-center text-[11px] text-muted">the Primer’s rows</span>
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
            <div className="text-[11px] text-muted">{k}</div>
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
        <div className="mb-1 font-semibold">The Primer’s handy conversion guide (used in every solution)</div>
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

export function PerfScaleVisual({ node, visual }: VisualProps) {
  const bl = bulletsAfter(topics.nodes[node.id], 'Another way to look at performance vs scalability:')
  const steps: ProcessStep[] = [
    bl[0] && { caption: 'With one user, the system with a performance problem is already slow.', source: bl[0].claim },
    bl[1] && { caption: 'Under heavy load, the system with a scalability problem slows down, though it was fast for one user.', source: bl[1].claim },
    visual.summary && { caption: 'A scalable system: add resources and performance grows in proportion.', source: visual.summary },
  ].filter(Boolean) as ProcessStep[]
  const stepper = useStepper(steps.length, 3600)
  const st = stepper.step
  const focus = st === 1 ? 'perf' : st === 2 ? 'scale' : st === 3 ? 'ok' : null
  // Illustrative response-time curves against load (no numbers come from the Primer).
  const W = 360
  const H = 150
  const X0 = 48
  const Y0 = 24
  const xs = Array.from({ length: 41 }, (_, i) => i / 40)
  const curves = {
    perf: { f: (x: number) => 0.72 + 0.1 * x, color: 'var(--bad)', label: ['Performance problem', 'slow even for one user'] },
    scale: { f: (x: number) => 0.12 + 0.82 * Math.pow(x, 3), color: 'var(--warn)', label: ['Scalability problem', 'fast alone, slow under load'] },
    ok: { f: (x: number) => 0.12 + 0.06 * x, color: 'var(--ok)', label: ['Scalable', 'resources added as load grows'] },
  }
  const px = (x: number) => X0 + x * W
  const py = (y: number) => Y0 + H - y * H
  const path = (f: (x: number) => number) => xs.map((x, i) => `${i ? 'L' : 'M'}${px(x)} ${py(f(x))}`).join('')
  const markerX = st === 1 ? 0 : st === 2 ? 1 : null
  // Labels sit at the right end of each line, spaced so they never overlap.
  const labelY = { scale: py(curves.scale.f(1)) + 4, perf: py(curves.perf.f(1)) + 22, ok: py(curves.ok.f(1)) + 4 }
  // Second chart: work served as servers are added.
  const servers = [1, 2, 3, 4, 5, 6, 7, 8]
  const sx = (n: number) => X0 + ((n - 1) / 7) * W
  const sy = (v: number) => Y0 + 120 - (v / 8) * 120
  const linear = servers.map((n, i) => `${i ? 'L' : 'M'}${sx(n)} ${sy(n)}`).join('')
  const flat = servers.map((n, i) => `${i ? 'L' : 'M'}${sx(n)} ${sy(2.6 * (1 - Math.exp(-(n - 1) / 1.6)) + 1)}`).join('')
  const dim = (k: keyof typeof curves) => (focus && focus !== k ? 0.22 : 1)
  return (
    <ProcessPlayer steps={steps} stepper={stepper}>
      <div className="flex flex-col gap-1">
        <Diagram width={560} height={210} title="Response time as the number of users grows, for three systems">
          <text x={X0} y={14} fontSize={11} fontWeight={600}>
            Response time as users grow
          </text>
          <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="var(--border)" />
          <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke="var(--border)" />
          <text x={X0 - 6} y={Y0 + 8} fontSize={10} textAnchor="end" className="muted">
            slow
          </text>
          <text x={X0 - 6} y={Y0 + H} fontSize={10} textAnchor="end" className="muted">
            fast
          </text>
          <text x={X0} y={Y0 + H + 16} fontSize={10} className="muted">
            one user
          </text>
          <text x={X0 + W} y={Y0 + H + 16} fontSize={10} textAnchor="end" className="muted">
            heavy load
          </text>
          {markerX !== null && (
            <g className="fade-in">
              <rect x={px(markerX) - (markerX ? 30 : 0)} y={Y0} width={30} height={H} fill="var(--accent-soft)" opacity={0.6} />
            </g>
          )}
          {(Object.keys(curves) as (keyof typeof curves)[]).map((k) => (
            <g key={k} opacity={dim(k)} style={{ transition: 'opacity 300ms' }}>
              <path d={path(curves[k].f)} fill="none" stroke={curves[k].color} strokeWidth={focus === k ? 3.2 : 2.4} strokeLinecap="round" />
              <text x={X0 + W + 8} y={labelY[k]} fontSize={10.5} fontWeight={700} style={{ fill: curves[k].color }}>
                {curves[k].label[0]}
              </text>
              <text x={X0 + W + 8} y={labelY[k] + 12} fontSize={9.5} className="muted">
                {curves[k].label[1]}
              </text>
            </g>
          ))}
        </Diagram>
        <div style={{ opacity: st === 0 || st === 3 ? 1 : 0.35, transition: 'opacity 300ms' }}>
          <Diagram width={560} height={170} title="Work served as servers are added: proportional for a scalable system, levelling off otherwise">
            <text x={X0} y={14} fontSize={11} fontWeight={600}>
              Work served as resources are added
            </text>
            <line x1={X0} y1={Y0 + 120} x2={X0 + W} y2={Y0 + 120} stroke="var(--border)" />
            <line x1={X0} y1={Y0} x2={X0} y2={Y0 + 120} stroke="var(--border)" />
            <text x={X0} y={Y0 + 136} fontSize={10} className="muted">
              1 server
            </text>
            <text x={X0 + W} y={Y0 + 136} fontSize={10} textAnchor="end" className="muted">
              8 servers
            </text>
            <path d={linear} fill="none" stroke="var(--ok)" strokeWidth={st === 3 ? 3.2 : 2.4} strokeLinecap="round" />
            <path d={flat} fill="none" stroke="var(--warn)" strokeWidth={2.2} strokeDasharray="5 4" strokeLinecap="round" />
            <text x={X0 + W + 8} y={sy(8) + 4} fontSize={10.5} fontWeight={700} style={{ fill: 'var(--ok)' }}>
              Scalable
            </text>
            <text x={X0 + W + 8} y={sy(8) + 16} fontSize={9.5} className="muted">
              grows in proportion
            </text>
            <text x={X0 + W + 8} y={sy(3.5) + 4} fontSize={10.5} fontWeight={700} style={{ fill: 'var(--warn)' }}>
              Not scalable
            </text>
            <text x={X0 + W + 8} y={sy(3.5) + 16} fontSize={9.5} className="muted">
              more servers stop helping
            </text>
          </Diagram>
        </div>
        <p className="px-1 text-[11px] text-muted">The curves are illustrative: the Primer gives the definitions, not numbers.</p>
      </div>
    </ProcessPlayer>
  )
}

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
          <div className="text-[11px] text-muted">Latency (time per item)</div>
          <div className="text-lg font-semibold tabular-nums">{LAT} s</div>
        </div>
        <div className="rounded-lg border border-line p-2.5">
          <div className="text-[11px] text-muted">Throughput (items per second)</div>
          <div className="text-lg font-semibold tabular-nums">{((2 * lanes) / LAT).toFixed(1)}</div>
        </div>
      </div>
      <p className="text-[11px] text-muted">Times are illustrative. Adding parallel workers raises throughput without changing each item’s latency.</p>
    </div>
  )
}
