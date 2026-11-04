import type { BEdge, BGroup, BNode, Builder } from '../../content/builders/types.ts'

export const NODE_W = 124
export const NODE_H = 46

export const nodeW = (n: BNode) => n.w ?? NODE_W
export const visibleAt = (x: { from: number; until?: number }, f: number) => f >= x.from && (x.until === undefined || f < x.until)
export const edgeFrom = (b: Builder, e: BEdge) => e.from ?? Math.max(...[e.a, e.b].map((id) => b.nodes.find((n) => n.id === id)!.from))
export const edgeVisibleAt = (b: Builder, e: BEdge, f: number) => f >= edgeFrom(b, e) && (e.until === undefined || f < e.until)
export const labelAt = (n: BNode, f: number) => (n.relabel && f >= n.relabel.from ? n.relabel.label : n.label)
export const flatLabel = (s: string) => s.replace(/\n/g, ' ')

export interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}
export const boxOf = (n: BNode, pad = 0): Box => ({
  x0: n.x - nodeW(n) / 2 - pad,
  y0: n.y - NODE_H / 2 - pad,
  x1: n.x + nodeW(n) / 2 + pad,
  y1: n.y + NODE_H / 2 + pad,
})

export function groupBox(b: Builder, g: BGroup): Box {
  const boxes = g.nodes.map((id) => boxOf(b.nodes.find((n) => n.id === id)!, 0))
  return {
    x0: Math.min(...boxes.map((x) => x.x0)) - 12,
    y0: Math.min(...boxes.map((x) => x.y0)) - (g.label ? 22 : 12),
    x1: Math.max(...boxes.map((x) => x.x1)) + 14,
    y1: Math.max(...boxes.map((x) => x.y1)) + 14,
  }
}

/** Where the ray from the box centre towards (tx, ty) leaves the box (plus a small gap). */
export function exitPoint(n: BNode, tx: number, ty: number, gap = 3): [number, number] {
  const hw = nodeW(n) / 2 + gap
  const hh = NODE_H / 2 + gap
  const dx = tx - n.x
  const dy = ty - n.y
  if (dx === 0 && dy === 0) return [n.x, n.y]
  const s = Math.min(dx === 0 ? Infinity : hw / Math.abs(dx), dy === 0 ? Infinity : hh / Math.abs(dy))
  return [n.x + dx * s, n.y + dy * s]
}

/** Path between two nodes: straight, a quadratic curve bulging sideways by `bend`, or a polyline through `via`
 * (with rounded corners). Clipped to the box edges. */
export function connect(a: BNode, b: BNode, bend = 0, via?: [number, number][]): { d: string; from: [number, number]; to: [number, number]; mid: [number, number] } {
  if (via?.length) {
    const from = exitPoint(a, via[0][0], via[0][1])
    const to = exitPoint(b, via[via.length - 1][0], via[via.length - 1][1], 5)
    const pts = [from, ...via, to]
    let d = `M${from[0]} ${from[1]}`
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1]
      const [cx, cy] = pts[i]
      const [nx, ny] = pts[i + 1]
      const r = Math.min(14, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2)
      const l1 = Math.hypot(cx - px, cy - py) || 1
      const l2 = Math.hypot(nx - cx, ny - cy) || 1
      d += `L${cx - ((cx - px) / l1) * r} ${cy - ((cy - py) / l1) * r}Q${cx} ${cy} ${cx + ((nx - cx) / l2) * r} ${cy + ((ny - cy) / l2) * r}`
    }
    d += `L${to[0]} ${to[1]}`
    const m = pts[Math.floor(pts.length / 2)]
    return { d, from, to, mid: [m[0], m[1]] }
  }
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const c: [number, number] = [mx - (dy / len) * bend, my + (dx / len) * bend]
  const from = bend ? exitPoint(a, c[0], c[1]) : exitPoint(a, b.x, b.y)
  const to = bend ? exitPoint(b, c[0], c[1], 5) : exitPoint(b, a.x, a.y, 5)
  const d = bend ? `M${from[0]} ${from[1]}Q${c[0]} ${c[1]} ${to[0]} ${to[1]}` : `M${from[0]} ${from[1]}L${to[0]} ${to[1]}`
  const mid: [number, number] = bend ? [(from[0] + 2 * c[0] + to[0]) / 4, (from[1] + 2 * c[1] + to[1]) / 4] : [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
  return { d, from, to, mid }
}

/** Frames of the builder that belong to an interview step. */
export const framesOfStep = (b: Builder, step: number) => b.frames.map((f, i) => [f, i] as const).filter(([f]) => f.step === step)
export const firstFrameOfStep = (b: Builder, step: number) => b.frames.findIndex((f) => f.step === step)
