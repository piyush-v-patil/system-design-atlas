import type { Association } from '../../content/class-diagrams/types.ts'
import type { PyClass, PyMember } from './parsePython.ts'

const CH = 7.1 // monospace char width at 11px (measured with a margin)
const ROW = 15
const HEAD = 26
const GAP_X = 28
const GAP_Y = 54
const MAX_ROW_W = 660

export const memberText = (m: PyMember) => (m.kind === 'method' ? `${m.name}(${m.params ?? ''})` : m.name)

export interface Placed {
  c: PyClass
  x: number
  y: number
  w: number
  h: number
}

function size(c: PyClass): { w: number; h: number } {
  const head = c.name.length * 7.6 + (c.isEnum || c.isAbstract ? 0 : 0)
  const texts = c.members.map(memberText)
  const w = Math.min(380, Math.max(120, head + 24, ...texts.map((t) => t.length * CH + 30)))
  const fields = c.members.filter((m) => m.kind !== 'method').length
  const methods = c.members.filter((m) => m.kind === 'method').length
  const stereo = c.isEnum || c.isAbstract ? 12 : 0
  const h = HEAD + stereo + (fields ? fields * ROW + 8 : 4) + (methods ? methods * ROW + 8 : 4)
  return { w, h }
}

/** Inheritance trees, top-down: subclasses under their base; trees placed left to right, wrapping into bands. */
export function layoutClasses(classes: PyClass[]): { placed: Map<string, Placed>; width: number; height: number } {
  const byName = new Map(classes.map((c) => [c.name, c]))
  const parent = (c: PyClass) => c.bases.find((b) => byName.has(b))
  const kids = new Map<string, PyClass[]>()
  for (const c of classes) {
    const p = parent(c)
    if (p) kids.set(p, [...(kids.get(p) ?? []), c])
  }
  const sz = new Map(classes.map((c) => [c.name, size(c)]))
  const treeW = (c: PyClass): number => {
    const ks = kids.get(c.name) ?? []
    const childW = ks.reduce((s, k) => s + treeW(k), 0) + GAP_X * Math.max(0, ks.length - 1)
    return Math.max(sz.get(c.name)!.w, childW)
  }
  const placed = new Map<string, Placed>()
  const place = (c: PyClass, x: number, y: number): number => {
    const tw = treeW(c)
    const { w, h } = sz.get(c.name)!
    placed.set(c.name, { c, x: x + (tw - w) / 2, y, w, h })
    let bottom = y + h
    const ks = kids.get(c.name) ?? []
    const childW = ks.reduce((s, k) => s + treeW(k), 0) + GAP_X * Math.max(0, ks.length - 1)
    let cx = x + (tw - childW) / 2
    for (const k of ks) {
      bottom = Math.max(bottom, place(k, cx, y + h + GAP_Y))
      cx += treeW(k) + GAP_X
    }
    return bottom
  }
  const roots = classes.filter((c) => !parent(c))
  let x = 0
  let y = 0
  let bandBottom = 0
  let width = 0
  for (const r of roots) {
    const tw = treeW(r)
    if (x > 0 && x + tw > MAX_ROW_W) {
      x = 0
      y = bandBottom + GAP_Y
    }
    bandBottom = Math.max(bandBottom, place(r, x, y))
    x += tw + GAP_X
    width = Math.max(width, x - GAP_X)
  }
  // pad for arrows and labels
  const pad = 12
  for (const p of placed.values()) {
    p.x += pad
    p.y += pad
  }
  return { placed, width: width + pad * 2, height: bandBottom + pad * 2 }
}

function exit(p: Placed, tx: number, ty: number): [number, number] {
  const cx = p.x + p.w / 2
  const cy = p.y + p.h / 2
  const dx = tx - cx
  const dy = ty - cy
  const s = Math.min(dx ? p.w / 2 / Math.abs(dx) : Infinity, dy ? p.h / 2 / Math.abs(dy) : Infinity)
  return [cx + dx * s, cy + dy * s]
}

/**
 * UML-style class diagram: inheritance (solid line, hollow triangle) read from the code; associations (dashed, open
 * arrow, labelled with the attribute) curated from attribute names. Selecting a class or member highlights its lines
 * in the code alongside.
 */
export function ClassDiagram({
  classes,
  associations,
  selected,
  onSelect,
  title,
}: {
  classes: PyClass[]
  associations: Association[]
  selected: { cls: string; line?: number } | null
  onSelect: (s: { cls: string; line?: number } | null) => void
  title: string
}) {
  const { placed, width, height } = layoutClasses(classes)
  const sel = selected?.cls
  const related = new Set<string>()
  if (sel) {
    related.add(sel)
    for (const c of classes) if (c.name === sel || c.bases.includes(sel)) [c.name, ...c.bases].forEach((n) => related.add(n))
    for (const a of associations) if (a.from === sel || a.to === sel) [a.from, a.to].forEach((n) => related.add(n))
  }
  const dim = (n: string) => sel !== undefined && !related.has(n)
  const assocGeom = associations.flatMap((a) => {
    const f = placed.get(a.from)
    const t = placed.get(a.to)
    if (!f || !t) return []
    // parallel associations between the same two classes are spread apart
    const same = associations.filter((x) => x.from === a.from && x.to === a.to)
    const off = (same.indexOf(a) - (same.length - 1) / 2) * 16
    const dx = t.x + t.w / 2 - (f.x + f.w / 2)
    const dy = t.y + t.h / 2 - (f.y + f.h / 2)
    const len = Math.hypot(dx, dy) || 1
    const ox = (-dy / len) * off
    const oy = (dx / len) * off
    const p0 = exit(f, t.x + t.w / 2 + ox, t.y + t.h / 2 + oy)
    const q0 = exit(t, f.x + f.w / 2 + ox, f.y + f.h / 2 + oy)
    const p: [number, number] = [p0[0] + ox, p0[1] + oy]
    const q: [number, number] = [q0[0] + ox, q0[1] + oy]
    return [{ key: `${a.from}.${a.attr}`, p, q, label: `${a.attr}${a.many ? ' *' : ''}`, faded: dim(a.from) || dim(a.to) }]
  })

  return (
    <div className="overflow-x-auto">
      <svg className="diagram class-diagram" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: Math.min(width, 640) }} role="img" aria-label={title}>
        <title>{title}</title>
        <defs>
          <marker id="uml-inherit" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
            <path d="M1 1L11 6L1 11z" fill="var(--surface)" stroke="var(--text-muted)" strokeWidth="1.2" />
          </marker>
          <marker id="uml-assoc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
          </marker>
        </defs>
        {classes.map((c) =>
          c.bases
            .filter((b) => placed.has(b))
            .map((b) => {
              const p = placed.get(b)!
              const k = placed.get(c.name)!
              const x1 = k.x + k.w / 2
              const x2 = p.x + p.w / 2
              const midY = (k.y + p.y + p.h) / 2
              return (
                <path
                  key={`${c.name}-${b}`}
                  d={`M${x1} ${k.y}V${midY}H${x2}V${p.y + p.h + 1}`}
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth={1.3}
                  markerEnd="url(#uml-inherit)"
                  opacity={dim(c.name) || dim(b) ? 0.25 : 1}
                />
              )
            }),
        )}
        {assocGeom.map((g) => (
          <path key={g.key} d={`M${g.p[0]} ${g.p[1]}L${g.q[0]} ${g.q[1]}`} fill="none" stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="5 4" markerEnd="url(#uml-assoc)" opacity={g.faded ? 0.2 : 1} />
        ))}
        {[...placed.values()].map(({ c, x, y, w, h }) => {
          const on = sel === c.name
          const fields = c.members.filter((m) => m.kind !== 'method')
          const methods = c.members.filter((m) => m.kind === 'method')
          const stereo = c.isEnum ? '«enumeration»' : c.isAbstract ? '«abstract»' : null
          let yy = y + HEAD + (stereo ? 12 : 0)
          const row = (m: PyMember) => {
            const ty = yy + 11
            yy += ROW
            const active = selected?.line === m.line
            return (
              <g
                key={`${m.kind}-${m.name}-${m.line}`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect({ cls: c.name, line: m.line })
                }}
              >
                <rect x={x + 2} y={ty - 11} width={w - 4} height={ROW} fill={active ? 'var(--mark)' : 'transparent'} />
                <text x={x + 10} y={ty} fontSize={11} className="font-mono" fontStyle={m.abstract ? 'italic' : undefined}>
                  <tspan className="muted">{m.kind === 'method' ? (m.property ? '◦ ' : '+ ') : m.kind === 'attr' ? '- ' : ''}</tspan>
                  {memberText(m)}
                </text>
              </g>
            )
          }
          return (
            <g
              key={c.name}
              data-class={c.name}
              className="cursor-pointer"
              opacity={dim(c.name) ? 0.35 : 1}
              onClick={() => onSelect(on && !selected?.line ? null : { cls: c.name })}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={`Class ${c.name}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(on ? null : { cls: c.name }))}
            >
              <rect x={x} y={y} width={w} height={h} rx={6} fill="var(--node-fill)" stroke={on ? 'var(--accent)' : 'var(--node-stroke)'} strokeWidth={on ? 2.2 : 1.4} />
              <rect x={x} y={y} width={w} height={HEAD + (stereo ? 12 : 0)} rx={6} fill={on ? 'var(--accent-soft)' : 'var(--surface-2)'} />
              {stereo && (
                <text x={x + w / 2} y={y + 12} fontSize={9.5} textAnchor="middle" className="muted">
                  {stereo}
                </text>
              )}
              <text x={x + w / 2} y={y + (stereo ? 30 : 17)} fontSize={12.5} fontWeight={700} textAnchor="middle" fontStyle={c.isAbstract ? 'italic' : undefined}>
                {c.name}
              </text>
              {fields.length > 0 && <line x1={x} x2={x + w} y1={yy} y2={yy} stroke="var(--node-stroke)" strokeWidth={0.8} />}
              {(() => {
                yy += fields.length ? 4 : 2
                return fields.map(row)
              })()}
              {(() => {
                yy += fields.length ? 4 : 2
                const sep = yy
                return (
                  <>
                    {methods.length > 0 && <line x1={x} x2={x + w} y1={sep} y2={sep} stroke="var(--node-stroke)" strokeWidth={0.8} />}
                    {(() => {
                      yy += 4
                      return methods.map(row)
                    })()}
                  </>
                )
              })()}
            </g>
          )
        })}
        {assocGeom.map((g) => (
          <text
            key={g.key}
            x={g.p[0] + (g.q[0] - g.p[0]) * 0.38}
            y={g.p[1] + (g.q[1] - g.p[1]) * 0.38 - 3}
            fontSize={9.5}
            textAnchor="middle"
            className="font-mono"
            opacity={g.faded ? 0.25 : 1}
            style={{ fill: 'var(--accent)', paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 3, pointerEvents: 'none' }}
          >
            {g.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
