import { cluster, hierarchy, type HierarchyPointNode } from 'd3-hierarchy'
import type { TopicNode, TopicsFile } from '../lib/types.ts'

export interface MapDatum {
  id: string
  node: TopicNode
  children?: MapDatum[]
}

/** The tree the map renders: exactly the heading tree from content/topics.json. */
export function buildMapTree(t: TopicsFile): MapDatum {
  const build = (id: string): MapDatum => {
    const node = t.nodes[id]
    return node.childIds.length ? { id, node, children: node.childIds.map(build) } : { id, node }
  }
  return build(t.rootId)
}

/** Ring radius for internal nodes by tree level. Every leaf sits on LEAF_R so leaf labels form one clean ring. */
export const RING = [0, 150, 270, 380, 470]
export const LEAF_R = 570
/** Area band just outside the leaves; H2 names sit beyond it (overview) or beyond the leaf labels (zoomed in). */
export const BAND_R = LEAF_R + 10
export const RIM_NEAR = BAND_R + 14
export const RIM_FAR = LEAF_R + 230

export interface LaidOutNode {
  id: string
  node: TopicNode
  /** Angle in radians, 0 = 12 o'clock, clockwise. */
  angle: number
  radius: number
  x: number
  y: number
  isLeaf: boolean
  parentId: string | null
}

export interface MapLayout {
  nodes: LaidOutNode[]
  links: { source: LaidOutNode; target: LaidOutNode }[]
  extent: number
}

const toXY = (angle: number, r: number) => ({ x: r * Math.sin(angle), y: -r * Math.cos(angle) })

/**
 * Radial dendrogram: angles from a cluster layout (each leaf gets its own slot, so radial leaf labels never cross),
 * leaves on one outer ring, internal nodes on rings by level. H2 groups are separated by wider gaps.
 */
export function layoutMap(t: TopicsFile): MapLayout {
  const root = hierarchy(buildMapTree(t))
  const top = (n: { ancestors(): { data: MapDatum }[] }) => {
    const a = n.ancestors()
    return a[Math.max(0, a.length - 2)].data.id
  }
  const laid = cluster<MapDatum>()
    .size([2 * Math.PI, 1])
    .separation((a, b) => (top(a) === top(b) ? (a.parent === b.parent ? 1 : 1.5) : 2.4))(root)

  const byId = new Map<string, LaidOutNode>()
  const nodes: LaidOutNode[] = []
  laid.each((p: HierarchyPointNode<MapDatum>) => {
    const radius = p.children ? RING[Math.min(p.depth, RING.length - 1)] : LEAF_R
    const angle = p.x
    const n: LaidOutNode = {
      id: p.data.id,
      node: p.data.node,
      angle,
      radius,
      ...toXY(angle, radius),
      isLeaf: !p.children,
      parentId: p.parent?.data.id ?? null,
    }
    byId.set(n.id, n)
    nodes.push(n)
  })
  const links = nodes.filter((n) => n.parentId).map((n) => ({ source: byId.get(n.parentId!)!, target: n }))
  // Fit to the overview: H2 names start at RIM_NEAR and run ~250 units outward.
  return { nodes, links, extent: RIM_NEAR + 250 }
}
