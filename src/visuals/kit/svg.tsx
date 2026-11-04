import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { usePrefersReducedMotion } from './motion.ts'

export type NodeKind = 'server' | 'db' | 'cache' | 'client' | 'lb' | 'app' | 'dns' | 'queue'
export type NodeState = 'normal' | 'active' | 'down' | 'dim' | 'standby' | 'ok' | 'warn'

const STATE: Record<NodeState, { fill: string; stroke: string; opacity?: number; dash?: string }> = {
  normal: { fill: 'var(--node-fill)', stroke: 'var(--node-stroke)' },
  active: { fill: 'var(--accent-soft)', stroke: 'var(--accent)' },
  down: { fill: 'var(--bad-soft)', stroke: 'var(--bad)' },
  dim: { fill: 'var(--node-fill)', stroke: 'var(--node-stroke)', opacity: 0.35 },
  standby: { fill: 'var(--node-fill)', stroke: 'var(--node-stroke)', dash: '4 3' },
  ok: { fill: 'var(--ok-soft)', stroke: 'var(--ok)' },
  warn: { fill: 'var(--warn-soft)', stroke: 'var(--warn)' },
}

/** Small glyph drawn inside a node, centred at (0,0). */
function Glyph({ kind, color }: { kind: NodeKind; color: string }) {
  const s = { stroke: color, fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'server':
      return (
        <g {...s}>
          <rect x={-8} y={-8} width={16} height={6} rx={1.5} />
          <rect x={-8} y={2} width={16} height={6} rx={1.5} />
          <circle cx={4.5} cy={-5} r={0.9} fill={color} />
          <circle cx={4.5} cy={5} r={0.9} fill={color} />
        </g>
      )
    case 'db':
      return (
        <g {...s}>
          <ellipse cx={0} cy={-6} rx={7} ry={2.6} />
          <path d="M-7 -6v12c0 1.5 3.1 2.6 7 2.6s7-1.1 7-2.6v-12M-7 0c0 1.5 3.1 2.6 7 2.6S7 1.5 7 0" />
        </g>
      )
    case 'cache':
      return <path {...s} d="M1.5 -9 L-5 1 H0 L-1.5 9 L5 -1 H0 Z" fill={color} fillOpacity={0.15} />
    case 'client':
      return (
        <g {...s}>
          <rect x={-9} y={-7} width={18} height={11} rx={1.5} />
          <path d="M-4 8h8M0 4v4" />
        </g>
      )
    case 'lb':
      return (
        <g {...s}>
          <path d="M-9 0h6M-3 0l6-6h6M-3 0l6 6h6M3 0h6" />
          <circle cx={-3} cy={0} r={1.6} fill={color} />
        </g>
      )
    case 'app':
      return <path {...s} d="M-4 -5l-5 5 5 5M4 -5l5 5-5 5M1.5 -7l-3 14" />
    case 'dns':
      return (
        <g {...s}>
          <circle r={8} />
          <path d="M-8 0h16M0 -8c-3.5 4-3.5 12 0 16M0 -8c3.5 4 3.5 12 0 16" />
        </g>
      )
    case 'queue':
      return (
        <g {...s}>
          <rect x={-9} y={-5} width={18} height={10} rx={1.5} />
          <path d="M-3 -5v10M3 -5v10" />
        </g>
      )
  }
}

/**
 * A component in a diagram: icon + label inside a themed shape. Databases are drawn as cylinders,
 * everything else as rounded boxes. (x, y) is the centre.
 */
export function Node({
  x,
  y,
  w = 96,
  h = 52,
  kind,
  label,
  sub,
  state = 'normal',
  badge,
}: {
  x: number
  y: number
  w?: number
  h?: number
  kind: NodeKind
  label: string
  sub?: string
  state?: NodeState
  badge?: { text: string; tone: 'ok' | 'bad' | 'warn' | 'accent' }
}) {
  const st = STATE[state]
  const left = x - w / 2
  const top = y - h / 2
  const ry = 6
  const shape =
    kind === 'db' ? (
      <path
        className="shape"
        d={`M${left} ${top + ry} a${w / 2} ${ry} 0 0 1 ${w} 0 v${h - 2 * ry} a${w / 2} ${ry} 0 0 1 ${-w} 0 Z M${left} ${top + ry} a${w / 2} ${ry} 0 0 0 ${w} 0`}
        fill={st.fill}
        stroke={st.stroke}
        strokeWidth={1.6}
        strokeDasharray={st.dash}
      />
    ) : (
      <rect className="shape" x={left} y={top} width={w} height={h} rx={kind === 'lb' ? h / 2 : 8} fill={st.fill} stroke={st.stroke} strokeWidth={1.6} strokeDasharray={st.dash} />
    )
  const glyphColor = state === 'down' ? 'var(--bad)' : state === 'active' ? 'var(--accent)' : 'var(--text-muted)'
  const textX = left + 30
  const midY = y + (kind === 'db' ? 3 : 0)
  return (
    <g opacity={st.opacity ?? 1} className="shape">
      {shape}
      <g transform={`translate(${left + 17},${midY})`}>
        <Glyph kind={kind} color={glyphColor} />
      </g>
      <text x={textX} y={sub ? midY - 3 : midY + 4} fontSize={12} fontWeight={600}>
        {label}
      </text>
      {sub && (
        <text x={textX} y={midY + 11} fontSize={10} className="muted">
          {sub}
        </text>
      )}
      {state === 'down' && (
        <path d={`M${x + w / 2 - 14} ${top + 6}l8 8m0-8l-8 8`} stroke="var(--bad)" strokeWidth={2} strokeLinecap="round" />
      )}
      {badge && <Badge x={x} y={top - 2} {...badge} />}
    </g>
  )
}

const TONE = {
  ok: ['var(--ok-soft)', 'var(--ok)'],
  bad: ['var(--bad-soft)', 'var(--bad)'],
  warn: ['var(--warn-soft)', 'var(--warn)'],
  accent: ['var(--accent-soft)', 'var(--accent)'],
} as const

export function Badge({ x, y, text, tone }: { x: number; y: number; text: string; tone: keyof typeof TONE }) {
  const w = text.length * 6 + 12
  return (
    <g transform={`translate(${x - w / 2},${y - 9})`} className="fade-in">
      <rect width={w} height={16} rx={8} fill={TONE[tone][0]} stroke={TONE[tone][1]} strokeWidth={1} />
      <text x={w / 2} y={11.5} fontSize={10} fontWeight={600} textAnchor="middle" style={{ fill: TONE[tone][1] }}>
        {text}
      </text>
    </g>
  )
}

export type WireState = 'idle' | 'active' | 'faded' | 'broken' | 'ok' | 'bad'
const WIRE: Record<WireState, { stroke: string; opacity: number; dash?: string; width: number }> = {
  idle: { stroke: 'var(--wire)', opacity: 0.9, width: 1.5 },
  active: { stroke: 'var(--accent)', opacity: 1, width: 2.2 },
  faded: { stroke: 'var(--wire)', opacity: 0.3, width: 1.5 },
  broken: { stroke: 'var(--bad)', opacity: 0.9, dash: '5 5', width: 1.8 },
  ok: { stroke: 'var(--ok)', opacity: 1, width: 2.2 },
  bad: { stroke: 'var(--bad)', opacity: 1, width: 2.2 },
}

/** A connection between two points; optional arrowheads and a label at the midpoint. */
export function Wire({
  d,
  state = 'idle',
  arrow = 'end',
  label,
  labelAt,
  dashed,
}: {
  d: string
  state?: WireState
  arrow?: 'end' | 'both' | 'none'
  label?: string
  labelAt?: [number, number]
  dashed?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const w = WIRE[state]
  return (
    <g className="wire" opacity={w.opacity}>
      <defs>
        <marker id={`m${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={w.stroke} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={w.stroke}
        strokeWidth={w.width}
        strokeDasharray={w.dash ?? (dashed ? '4 4' : undefined)}
        markerEnd={arrow !== 'none' ? `url(#m${id})` : undefined}
        markerStart={arrow === 'both' ? `url(#m${id})` : undefined}
      />
      {label && labelAt && (
        <text x={labelAt[0]} y={labelAt[1]} fontSize={10} textAnchor="middle" className="muted" style={{ paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 3 }}>
          {label}
        </text>
      )}
    </g>
  )
}

/** Straight-line path helper. */
export const line = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`
/** Gentle curve between two points (bulges sideways by `bend`). */
export const curve = (a: [number, number], b: [number, number], bend = 0) => {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  return `M${a[0]} ${a[1]}Q${mx - (dy / len) * bend} ${my + (dx / len) * bend} ${b[0]} ${b[1]}`
}

/**
 * A message travelling along a path. Components re-key packets on every step so the animation replays. SVG `begin`
 * times are relative to document load, so the motion is started explicitly with beginElement() after mount.
 * With reduced motion the packet is drawn at its destination.
 */
export function Packet({
  path,
  to,
  label,
  tone = 'accent',
  dur = 0.9,
  delay = 0,
  color,
}: {
  path: string
  to: [number, number]
  label?: string
  tone?: keyof typeof TONE
  dur?: number
  delay?: number
  /** Override the stroke colour (e.g. to tell clients apart). */
  color?: string
}) {
  const reduced = usePrefersReducedMotion()
  const motion = useRef<SVGAnimateMotionElement>(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => {
      setStarted(true)
      try {
        motion.current?.beginElement()
      } catch {
        /* SMIL unsupported: packet stays hidden; the step text still explains the move */
      }
    }, delay * 1000)
    return () => clearTimeout(t)
  }, [reduced, delay])
  const fill = TONE[tone][0]
  const stroke = color ?? TONE[tone][1]
  const body = (
    <>
      <circle r={label ? 9 : 6} fill={fill} stroke={stroke} strokeWidth={1.8} />
      {label && (
        <text y={3.5} fontSize={9} fontWeight={700} textAnchor="middle" style={{ fill: stroke }}>
          {label}
        </text>
      )}
    </>
  )
  if (reduced) return <g transform={`translate(${to[0]},${to[1]})`}>{body}</g>
  return (
    <g opacity={started ? 1 : 0}>
      {body}
      <animateMotion ref={motion} path={path} dur={`${dur}s`} begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
    </g>
  )
}

/** Responsive SVG frame with an accessible title. */
export function Diagram({ width, height, title, children }: { width: number; height: number; title: string; children: ReactNode }) {
  return (
    <svg className="diagram" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <title>{title}</title>
      {children}
    </svg>
  )
}

export function Caption({ x, y, children, anchor = 'middle', tone }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; tone?: 'ok' | 'bad' | 'warn' | 'muted' }) {
  const color = tone === 'muted' || !tone ? undefined : `var(--${tone})`
  return (
    <text x={x} y={y} fontSize={11} textAnchor={anchor} className={`fade-in${tone === 'muted' ? ' muted' : ''}`} style={color ? { fill: color, fontWeight: 600 } : undefined}>
      {children}
    </text>
  )
}
