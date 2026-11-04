import { useMemo, useState, type ReactNode } from 'react'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { q } from '../../../content/visuals/types.ts'
import { LineRef } from '../kit/Claims.tsx'
import { ModeToggle } from '../kit/Stepper.tsx'
import {
  combine,
  comp,
  downtime,
  formatDuration,
  formatPct,
  group,
  nines,
  parseDowntimeTable,
  PRESETS,
  type AvGroup,
  type AvItem,
} from '../tools/availability.ts'

/* ------------------------------------------------------------------ block diagram */

interface Box {
  w: number
  h: number
  draw: (x: number, y: number) => ReactNode
}
const CW = 118
const CH = 40
const GAP = 22

function layout(item: AvItem, depth = 0): Box {
  if (item.kind === 'component') {
    const a = combine(item)
    return {
      w: CW,
      h: CH,
      draw: (x, y) => (
        <g key={item.id}>
          <rect x={x} y={y} width={CW} height={CH} rx={7} fill="var(--node-fill)" stroke={a < 0.99 ? 'var(--warn)' : 'var(--node-stroke)'} strokeWidth={1.5} />
          <text x={x + CW / 2} y={y + 16} fontSize={11} fontWeight={600} textAnchor="middle">
            {item.name.length > 16 ? item.name.slice(0, 15) + '…' : item.name}
          </text>
          <text x={x + CW / 2} y={y + 31} fontSize={10} textAnchor="middle" className="muted">
            {formatPct(a, 4)}
          </text>
        </g>
      ),
    }
  }
  const kids = item.children.map((c) => layout(c, depth + 1))
  const pad = 10
  const top = 16
  if (kids.length === 0) return { w: CW, h: CH, draw: () => null }
  if (item.mode === 'series') {
    const innerW = kids.reduce((s, k) => s + k.w, 0) + GAP * (kids.length - 1)
    const innerH = Math.max(...kids.map((k) => k.h))
    const w = innerW + pad * 2
    const h = innerH + pad * 2 + top
    return {
      w,
      h,
      draw: (x, y) => {
        let cx = x + pad
        const mid = y + top + pad + innerH / 2
        const out: ReactNode[] = []
        kids.forEach((k, i) => {
          out.push(k.draw(cx, mid - k.h / 2))
          if (i < kids.length - 1) out.push(<line key={`l${i}`} x1={cx + k.w} y1={mid} x2={cx + k.w + GAP} y2={mid} stroke="var(--wire)" strokeWidth={1.5} />)
          cx += k.w + GAP
        })
        return (
          <g key={item.id}>
            {depth > 0 && <rect x={x} y={y} width={w} height={h} rx={9} fill="none" stroke="var(--border)" strokeDasharray="4 3" />}
            {depth > 0 && (
              <text x={x + 8} y={y + 12} fontSize={9} className="muted">
                in sequence · {formatPct(combine(item))}
              </text>
            )}
            {out}
          </g>
        )
      },
    }
  }
  const rail = 16
  const innerW = Math.max(...kids.map((k) => k.w))
  const innerH = kids.reduce((s, k) => s + k.h, 0) + 10 * (kids.length - 1)
  const w = innerW + (pad + rail) * 2
  const h = innerH + pad * 2 + top
  return {
    w,
    h,
    draw: (x, y) => {
      let cy = y + top + pad
      const left = x + pad
      const right = x + w - pad
      const mid = y + top + pad + innerH / 2
      const out: ReactNode[] = []
      kids.forEach((k, i) => {
        const kx = x + (w - k.w) / 2
        const ky = cy + k.h / 2
        out.push(<path key={`p${i}`} d={`M${left} ${mid}L${left} ${ky}L${kx} ${ky}M${kx + k.w} ${ky}L${right} ${ky}L${right} ${mid}`} fill="none" stroke="var(--wire)" strokeWidth={1.5} />)
        out.push(k.draw(kx, cy))
        cy += k.h + 10
      })
      return (
        <g key={item.id}>
          <rect x={x} y={y} width={w} height={h} rx={9} fill="none" stroke="var(--accent)" strokeOpacity={0.5} strokeDasharray="4 3" />
          <text x={x + 8} y={y + 12} fontSize={9} style={{ fill: 'var(--accent)' }}>
            in parallel · {formatPct(combine(item))}
          </text>
          {out}
        </g>
      )
    },
  }
}

function BlockDiagram({ root }: { root: AvGroup }) {
  const box = layout(root)
  const W = box.w + 60
  const H = box.h + 10
  return (
    <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Block diagram of the components in sequence and in parallel" style={{ maxHeight: 360 }}>
      <line x1={4} y1={H / 2} x2={30} y2={H / 2} stroke="var(--wire)" strokeWidth={1.5} />
      <line x1={W - 30} y1={H / 2} x2={W - 4} y2={H / 2} stroke="var(--wire)" strokeWidth={1.5} />
      <circle cx={4} cy={H / 2} r={3} fill="var(--wire)" />
      <circle cx={W - 4} cy={H / 2} r={3} fill="var(--wire)" />
      {box.draw(30, 5)}
    </svg>
  )
}

/* ------------------------------------------------------------------ editor */

function update(root: AvGroup, id: string, fn: (it: AvItem) => AvItem | null): AvGroup {
  const walk = (it: AvItem): AvItem | null => {
    if (it.id === id) return fn(it)
    if (it.kind === 'group') return { ...it, children: it.children.map(walk).filter((c): c is AvItem => c !== null) }
    return it
  }
  return walk(root) as AvGroup
}

function GroupEditor({ g, depth, onChange, root }: { g: AvGroup; depth: number; root: AvGroup; onChange: (r: AvGroup) => void }) {
  const set = (id: string, fn: (it: AvItem) => AvItem | null) => onChange(update(root, id, fn))
  return (
    <div className={`flex flex-col gap-1.5 ${depth > 0 ? 'rounded-lg border border-dashed border-line p-2' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <ModeToggle
          label="Combine these"
          value={g.mode}
          onChange={(mode) => set(g.id, (it) => ({ ...(it as AvGroup), mode }))}
          options={[
            { value: 'series', label: 'In sequence' },
            { value: 'parallel', label: 'In parallel' },
          ]}
        />
        <button className="btn btn-sm btn-secondary" onClick={() => set(g.id, (it) => ({ ...(it as AvGroup), children: [...(it as AvGroup).children, comp(`Component ${(it as AvGroup).children.length + 1}`, 99.9)] }))}>
          + component
        </button>
        {depth < 2 && (
          <button className="btn btn-sm btn-secondary" onClick={() => set(g.id, (it) => ({ ...(it as AvGroup), children: [...(it as AvGroup).children, group('parallel', [comp('A', 99.9), comp('B', 99.9)])] }))}>
            + group
          </button>
        )}
        {depth > 0 && (
          <button className="ml-auto rounded-md px-2 py-1 text-xs text-muted hover:text-bad" onClick={() => set(g.id, () => null)} aria-label="Remove group">
            remove group
          </button>
        )}
      </div>
      {g.children.map((c) =>
        c.kind === 'group' ? (
          <GroupEditor key={c.id} g={c} depth={depth + 1} root={root} onChange={onChange} />
        ) : (
          <div key={c.id} className="flex items-center gap-1.5">
            <input
              aria-label="Component name"
              value={c.name}
              onChange={(e) => set(c.id, (it) => ({ ...it, name: e.target.value }) as AvItem)}
              className="w-32 min-w-0 rounded-md border border-line bg-surface px-2 py-1 text-sm"
            />
            <input
              aria-label={`${c.name} availability in percent`}
              type="number"
              min={0}
              max={100}
              step="any"
              value={c.pct}
              onChange={(e) => set(c.id, (it) => ({ ...it, pct: Math.min(100, Math.max(0, Number(e.target.value))) }) as AvItem)}
              className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm tabular-nums"
            />
            <span className="text-xs text-muted">%</span>
            <button onClick={() => set(c.id, () => null)} className="rounded px-1.5 text-muted hover:text-bad" aria-label={`Remove ${c.name}`}>
              ✕
            </button>
          </div>
        ),
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ calculator */

const PRIMER_TABLES: Record<string, string> = { '0.999': '999-availability---three-9s', '0.9999': '9999-availability---four-9s' }

export function AvailabilityCalculator({ visual }: VisualProps) {
  const presetKey = (visual.props?.preset as string) ?? 'stack'
  const [preset, setPreset] = useState(presetKey)
  const [root, setRoot] = useState<AvGroup>(() => PRESETS[presetKey].build())
  const a = combine(root)
  const dt = downtime(a)
  const primerTableId = PRIMER_TABLES[String(Math.round(a * 1e6) / 1e6)]
  const primer = useMemo(() => (primerTableId ? parseDowntimeTable(topics.nodes[primerTableId].markdown) : []), [primerTableId])
  const n = nines(a)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4" data-calculator>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-muted" htmlFor="av-preset">
          Start from
        </label>
        <select
          id="av-preset"
          value={preset}
          onChange={(e) => {
            setPreset(e.target.value)
            setRoot(PRESETS[e.target.value].build())
          }}
          className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
        >
          {Object.entries(PRESETS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        {PRESETS[preset].example && <span className="text-[11px] text-muted">Example values.</span>}
      </div>

      <div className="overflow-x-auto rounded-lg bg-bg/60 p-2">
        <BlockDiagram root={root} />
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <GroupEditor g={root} depth={0} root={root} onChange={setRoot} />
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Combined availability</div>
            <div className="text-2xl font-semibold tabular-nums" aria-live="polite">
              {formatPct(a)}
            </div>
            <div className="text-xs text-muted">{isFinite(n) ? `≈ ${n.toFixed(2)} nines` : 'no downtime'}</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1 font-medium">Downtime per</th>
                <th className="py-1 font-medium">Computed</th>
                {primer.length > 0 && <th className="py-1 font-medium">Table</th>}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {(['year', 'month', 'week', 'day'] as const).map((p) => {
                const row = primer.find((r) => r.period === p)
                const ok = row ? Math.abs(row.seconds - dt[p]) <= 0.6 : true
                return (
                  <tr key={p} className="border-t border-line">
                    <td className="py-1 capitalize">{p}</td>
                    <td className="py-1">{formatDuration(dt[p])}</td>
                    {primer.length > 0 && (
                      <td className={`py-1 ${ok ? '' : 'text-warn'}`}>
                        {row?.text} {ok ? '✓' : '⚠'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {primer.some((r) => Math.abs(r.seconds - dt[r.period]) > 0.6) && (
            <p className="text-xs text-warn">⚠ The table’s weekly figure doesn’t match the arithmetic (0.01% × 7 days = 60.48 s). Its other cells match.</p>
          )}
        </div>
      </div>
      <div className="grid gap-1 text-xs text-muted sm:grid-cols-2">
        <p>
          <span className="font-semibold text-ink">In sequence:</span> <code>Availability (Total) = Availability (Foo) * Availability (Bar)</code>
          <LineRef claim={q('Availability (Total) = Availability (Foo) * Availability (Bar)', 566)} />
        </p>
        <p>
          <span className="font-semibold text-ink">In parallel:</span> <code>Availability (Total) = 1 - (1 - Availability (Foo)) * (1 - Availability (Bar))</code>
          <LineRef claim={q('Availability (Total) = 1 - (1 - Availability (Foo)) * (1 - Availability (Bar))', 576)} />
        </p>
      </div>
    </div>
  )
}

/** The Primer's downtime table next to the computed values, with a bar per period. */
export function DowntimeTable({ visual, node }: VisualProps) {
  const target = Number(visual.props?.availability ?? 0.999)
  const rows = parseDowntimeTable(topics.nodes[node.id].markdown)
  const dt = downtime(target)
  const max = Math.max(...rows.map((r) => r.seconds))
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="text-sm">
        <span className="font-semibold">{formatPct(target)}</span> <span className="text-muted">available means this much downtime is acceptable:</span>
      </div>
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="py-1 font-medium">Per</th>
            <th className="py-1 font-medium">Table</th>
            <th className="py-1 font-medium">Computed</th>
            <th className="w-2/5 py-1 font-medium" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ok = Math.abs(r.seconds - dt[r.period]) <= 0.6
            return (
              <tr key={r.period} className="border-t border-line">
                <td className="py-1.5 capitalize">{r.period}</td>
                <td className={`py-1.5 ${ok ? '' : 'font-semibold text-warn'}`}>{r.text}</td>
                <td className="py-1.5">
                  {formatDuration(dt[r.period])} {ok ? <span className="text-ok">✓</span> : <span className="text-warn">⚠</span>}
                </td>
                <td className="py-1.5">
                  <div className="h-2 rounded-full bg-surface-2">
                    <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(1.5, (Math.log10(1 + dt[r.period]) / Math.log10(1 + max)) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-muted">Computed with a 365.2425-day year and month = year ÷ 12, which reproduces the table’s other cells. Bars use a log scale.</p>
    </div>
  )
}
