import type { BNode, Builder } from '../../content/builders/types.ts'
import { Diagram, Node, Packet, Wire, type NodeState } from '../visuals/kit/svg.tsx'
import { NODE_H, connect, edgeFrom, edgeVisibleAt, flatLabel, groupBox, labelAt, nodeW, visibleAt, type Box } from './geometry.ts'

const DASH = { dashed: '5 4', dotdash: '9 4 2 4' } as const

/** Where the ray from a box's centre towards (tx, ty) leaves the box. */
function boxExit(b: Box, tx: number, ty: number): [number, number] {
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  const dx = tx - cx
  const dy = ty - cy
  const s = Math.min(dx ? (b.x1 - cx) / Math.abs(dx) : Infinity, dy ? (b.y1 - cy) / Math.abs(dy) : Infinity)
  return [cx + dx * s, cy + dy * s]
}

export interface ActiveHop {
  a: string
  b: string
  /** Changes on every step so the packet replays. */
  key: string | number
}

/**
 * The diagram for one frame of a builder: boxes, wires and groups visible at that frame. Components added in this
 * frame pop in and are marked "new"; `focus` highlights components (e.g. a selected Step 4 addition); `hop` animates a
 * request between two components.
 */
export function ArchitectureCanvas({
  builder: b,
  frame,
  focus,
  hop,
  title,
  thumb,
}: {
  builder: Builder
  frame: number
  focus?: ReadonlySet<string>
  hop?: ActiveHop | null
  title: string
  /** Static thumbnail: no "new" highlights, scales to fit its box. */
  thumb?: boolean
}) {
  const byId = new Map(b.nodes.map((n) => [n.id, n]))
  const nodes = b.nodes.filter((n) => visibleAt(n, frame))
  const edges = b.edges.filter((e) => edgeVisibleAt(b, e, frame))
  const groups = (b.groups ?? []).filter((g) => visibleAt(g, frame))
  const hopIds = hop ? new Set([hop.a, hop.b]) : null
  const lit = hopIds ?? (focus && focus.size ? focus : null)
  const isNew = (n: BNode) => !thumb && frame > 0 && (n.from === frame || n.relabel?.from === frame)

  const nodeState = (n: BNode): NodeState => {
    if (lit) return lit.has(n.id) ? 'active' : 'dim'
    return isNew(n) ? 'ok' : 'normal'
  }

  // The packet follows the drawn edge (in either direction) or, if the text describes a call the diagram does not
  // draw, a dotted line.
  let packet: { d: string; to: [number, number]; drawn: boolean } | null = null
  if (hop) {
    const a = byId.get(hop.a)!
    const z = byId.get(hop.b)!
    const fwd = edges.find((e) => e.a === hop.a && e.b === hop.b)
    const back = edges.find((e) => e.a === hop.b && e.b === hop.a)
    const c = fwd ? connect(a, z, fwd.bend, fwd.via) : back ? connect(a, z, back.bend !== undefined ? -back.bend : 0, back.via ? [...back.via].reverse() : undefined) : connect(a, z)
    packet = { d: c.d, to: c.to, drawn: !!(fwd || back) }
  }

  return (
    <div className={thumb ? 'builder pointer-events-none size-full' : 'builder overflow-x-auto'}>
      <div className={thumb ? 'size-full' : undefined} style={thumb ? undefined : { minWidth: Math.min(b.width, 560) }}>
        <Diagram width={b.width} height={b.height} title={title}>
          {groups.map((g) => {
            const bx = groupBox(b, g)
            return (
              <g key={g.id} className="bgroup">
                <rect x={bx.x0} y={bx.y0} width={bx.x1 - bx.x0} height={bx.y1 - bx.y0} rx={10} fill="none" stroke="var(--text-muted)" strokeDasharray="5 4" strokeWidth={1.2} />
                {(g.linkTo ?? []).map((t) => {
                  const other = b.groups!.find((x) => x.id === t)!
                  const ob = groupBox(b, other)
                  const p = boxExit(bx, (ob.x0 + ob.x1) / 2, (ob.y0 + ob.y1) / 2)
                  const q = boxExit(ob, (bx.x0 + bx.x1) / 2, (bx.y0 + bx.y1) / 2)
                  return <path key={t} d={`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`} stroke="var(--text-muted)" strokeDasharray="5 4" strokeWidth={1.2} fill="none" />
                })}
              </g>
            )
          })}
          {edges.map((e) => {
            const a = byId.get(e.a)!
            const z = byId.get(e.b)!
            const c = connect(a, z, e.bend, e.via)
            const onHop = hop && ((e.a === hop.a && e.b === hop.b) || (e.a === hop.b && e.b === hop.a))
            const faded = lit && !onHop && !(focus?.has(e.a) && focus?.has(e.b))
            const fresh = !thumb && frame > 0 && edgeFrom(b, e) === frame
            return (
              <g key={`${e.a}-${e.b}`} className={fresh ? 'bedge-new' : undefined}>
                <Wire d={c.d} state={onHop ? 'active' : faded ? 'faded' : 'idle'} arrow={e.style === 'dashed' ? 'none' : 'end'} dash={e.style ? DASH[e.style] : undefined} />
              </g>
            )
          })}
          {groups.map((g) => {
            const bx = groupBox(b, g)
            return g.label ? (
              <text key={g.id} x={bx.x0 + 8} y={bx.y0 + 14} fontSize={10.5} fontWeight={600} className="muted bgroup" style={{ paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 4 }}>
                {g.label}
              </text>
            ) : null
          })}
          {packet && !packet.drawn && <path d={packet.d} fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="2 4" className="fade-in" />}
          {nodes.map((n) => {
            const w = nodeW(n)
            const stacked = n.multi !== undefined && frame >= n.multi
            const st = nodeState(n)
            return (
              <g key={n.id} className={`bnode${isNew(n) && !lit ? ' bnode-new' : ''}`} data-node={n.id}>
                {stacked &&
                  [10, 5].map((o) => (
                    <g key={o} opacity={st === 'dim' ? 0.35 : 0.9}>
                      <Node x={n.x + o} y={n.y + o} w={w} h={NODE_H} kind={n.kind} label="" />
                    </g>
                  ))}
                <Node x={n.x} y={n.y} w={w} h={NODE_H} kind={n.kind} label={labelAt(n, frame)} state={st} badge={isNew(n) && !lit ? { text: n.relabel?.from === frame ? 'renamed' : 'new', tone: 'ok' } : undefined} />
              </g>
            )
          })}
          {b.legend && !thumb && (
            <g transform={`translate(12,${b.height - 12 - b.legend.length * 16})`} fontSize={10.5}>
              {b.legend.map((l, i) => (
                <g key={l.label} transform={`translate(0,${i * 16})`}>
                  <path d="M0 6h34" stroke="var(--wire)" strokeWidth={1.5} strokeDasharray={l.style === 'solid' ? undefined : DASH[l.style]} />
                  <text x={42} y={9.5} className="muted">
                    {l.label}
                  </text>
                </g>
              ))}
            </g>
          )}
          {packet && hop && <Packet key={hop.key} path={packet.d} to={packet.to} dur={0.9} />}
        </Diagram>
      </div>
    </div>
  )
}

/** Accessible list of what the frame shows, for screen readers and as a text alternative. */
export function frameSummary(b: Builder, frame: number): string {
  const ns = b.nodes.filter((n) => visibleAt(n, frame)).map((n) => flatLabel(labelAt(n, frame)))
  return ns.join(', ')
}

