import type { TopicNode, TopicsFile } from '../lib/types.ts'

/**
 * Focus view: one topic in the middle, its children branching out, and (when there is room) its grandchildren
 * beyond them, like a mind map. Labels stay horizontal so they read at any width. Deeper levels are one click away.
 */

export type FocusRole = 'focus' | 'parent' | 'child' | 'grandchild'

export interface FocusNode {
  id: string
  node: TopicNode
  role: FocusRole
  x: number
  y: number
  /** 1 = branch grows to the right, -1 = to the left. */
  side: 1 | -1
  label: string
  labelW: number
  /** For a child whose own children are not drawn: how many there are. */
  hidden: number
}

export interface FocusLink {
  id: string
  d: string
  role: 'child' | 'grandchild' | 'parent'
  target: string
}

export interface FocusLayout {
  focusId: string
  nodes: FocusNode[]
  links: FocusLink[]
  bounds: { x0: number; y0: number; x1: number; y1: number }
  showGrandchildren: boolean
}

const CH = 7.3 // px per character at 12.5px semibold
const CH_SMALL = 6.1 // at 11px
const MAX_CHARS = 34
const ROW = 23
const KID_GAP = 10
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

/** Under their parent, "Disadvantage(s): sharding" and "Source(s) and further reading: …" need no suffix. */
export function shortTitle(n: TopicNode): string {
  if (n.kind === 'disadvantages') return 'Disadvantages'
  if (n.kind === 'sources') return 'Further reading'
  return n.title
}

/** The node to centre on: the selected topic if it has children, otherwise its parent (so siblings give context). */
export function focusFor(t: TopicsFile, selectedId?: string): string {
  const n = selectedId ? t.nodes[selectedId] : undefined
  if (!n) return t.rootId
  if (n.childIds.length > 0 || !n.parentId) return n.id
  return n.parentId
}

export function centerWidth(title: string) {
  return Math.min(260, truncate(title, 30).length * 7.6 + 34)
}

export function layoutFocus(t: TopicsFile, focusId: string, opts: { twoSided: boolean; maxGrandchildren: number }): FocusLayout {
  const focus = t.nodes[focusId]
  const kids = focus.childIds.map((id) => t.nodes[id])
  const totalGc = kids.reduce((s, k) => s + k.childIds.length, 0)
  const showGc = totalGc > 0 && totalGc <= opts.maxGrandchildren
  const centre = focus.parentId ? focus.title : 'System Design Atlas'
  const cw = centerWidth(centre)
  const halfC = cw / 2

  // Height of each child's block: one row per grandchild when they are drawn.
  const blockH = kids.map((k) => (showGc && k.childIds.length ? k.childIds.length * ROW : ROW + 5))
  let split = kids.length
  if (opts.twoSided && kids.length > 1) {
    const total = blockH.reduce((a, b) => a + b, 0)
    let acc = 0
    let best = Infinity
    for (let i = 1; i < kids.length; i++) {
      acc += blockH[i - 1]
      const diff = Math.abs(acc - (total - acc))
      if (diff < best) {
        best = diff
        split = i
      }
    }
  }
  const sides: { side: 1 | -1; idx: number[] }[] = [{ side: 1, idx: kids.map((_, i) => i).slice(0, split) }]
  if (split < kids.length) sides.push({ side: -1, idx: kids.map((_, i) => i).slice(split) })

  const nodes: FocusNode[] = []
  const links: FocusLink[] = []
  const X1 = halfC + 64
  let maxSideH = 0
  let minX = -halfC
  let maxX = halfC

  for (const { side, idx } of sides) {
    const h = idx.reduce((s, i) => s + blockH[i], 0) + KID_GAP * (idx.length - 1)
    maxSideH = Math.max(maxSideH, h)
    const kidLabelW = Math.max(0, ...idx.map((i) => truncate(shortTitle(kids[i]), MAX_CHARS).length * CH + 8 + (showGc ? 0 : kids[i].childIds.length ? 34 : 0)))
    const X2 = X1 + kidLabelW + 58
    let y = -h / 2
    for (const i of idx) {
      const k = kids[i]
      const ky = y + blockH[i] / 2
      const label = truncate(shortTitle(k), MAX_CHARS)
      const labelW = label.length * CH + 8
      const hidden = showGc ? 0 : k.childIds.length
      nodes.push({ id: k.id, node: k, role: 'child', x: side * X1, y: ky, side, label, labelW, hidden })
      const x0 = side * halfC
      const kx = side * (X1 - 6)
      links.push({ id: `l-${k.id}`, target: k.id, role: 'child', d: `M${x0} 0C${x0 + side * 46} 0 ${kx - side * 40} ${ky} ${kx} ${ky}` })
      const kidEnd = side * (X1 + 14 + labelW + (hidden ? 34 : 0))
      if (side === 1) maxX = Math.max(maxX, kidEnd)
      else minX = Math.min(minX, kidEnd)

      if (showGc) {
        k.childIds.forEach((gid, j) => {
          const g = t.nodes[gid]
          const gy = y + ROW * (j + 0.5)
          const gl = truncate(shortTitle(g), MAX_CHARS)
          const gw = gl.length * CH_SMALL + 8
          nodes.push({ id: gid, node: g, role: 'grandchild', x: side * X2, y: gy, side, label: gl, labelW: gw, hidden: g.childIds.length })
          const sx = side * (X1 + 14 + labelW)
          const ex = side * (X2 - 5)
          links.push({ id: `l-${gid}`, target: gid, role: 'grandchild', d: `M${sx} ${ky}C${sx + side * 26} ${ky} ${ex - side * 26} ${gy} ${ex} ${gy}` })
          const end = side * (X2 + 12 + gw + (g.childIds.length ? 34 : 0))
          if (side === 1) maxX = Math.max(maxX, end)
          else minX = Math.min(minX, end)
        })
      }
      y += blockH[i] + KID_GAP
    }
  }

  nodes.unshift({ id: focus.id, node: focus, role: 'focus', x: 0, y: 0, side: 1, label: truncate(centre, 30), labelW: cw, hidden: 0 })

  let minY = -Math.max(maxSideH / 2, 24)
  const maxY = Math.max(maxSideH / 2, 24)
  if (focus.parentId) {
    const p = t.nodes[focus.parentId]
    const py = minY - 46
    const label = truncate(p.title, 30)
    nodes.push({ id: p.id, node: p, role: 'parent', x: 0, y: py, side: 1, label, labelW: label.length * CH_SMALL + 30, hidden: 0 })
    links.push({ id: `l-up-${p.id}`, target: p.id, role: 'parent', d: `M0 ${py + 12}L0 -18` })
    minY = py - 18
    const pw = label.length * CH_SMALL + 30
    minX = Math.min(minX, -pw / 2)
    maxX = Math.max(maxX, pw / 2)
  }
  return { focusId, nodes, links, bounds: { x0: minX, y0: minY, x1: maxX, y1: maxY }, showGrandchildren: showGc }
}
