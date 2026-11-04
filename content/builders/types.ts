/**
 * Hand-transcribed architecture builders for the system design solutions (Phase 4).
 *
 * Every node and edge is transcribed from the Primer's own diagrams (the Step 2 "basic" image and the Step 4 final
 * image, or the per-stage images of the AWS solution). Every sentence shown next to the diagram is cut from the
 * solution README at a cited line, so it is verbatim by construction; tests/builders.test.ts checks the lines,
 * the node references and the arithmetic.
 */
import type { NodeKind } from '../../src/visuals/kit/svg.tsx'

/** One stage of the build. `step` is the interview step (1–4) of the solution README it belongs to. */
export interface Frame {
  step: 1 | 2 | 3 | 4
  label: string
  /** The Primer image this frame reproduces, as referenced in the README. */
  image?: string
  /** Heading node (in the solution document) whose text describes this frame; defaults to the step's section. */
  sectionTitle?: string
  /** Builder-specific explanation (not from the Primer), e.g. why Step 2 is split across two frames. */
  note?: string
  /** README lines shown (verbatim) as the key points of this frame. */
  lines?: number[]
}

export interface BNode {
  id: string
  /** Label as written in the Primer's diagram; "\n" breaks the line. */
  label: string
  kind: NodeKind
  x: number
  y: number
  w?: number
  /** Frame index where the node appears, and (exclusive) where it is removed or replaced. */
  from: number
  until?: number
  /** Frame index from which the diagram draws the node as a stack (multiple instances). */
  multi?: number
  /** Names the text uses for this component, if different from the label (used to check flows). */
  aka?: string[]
  /** The diagram renames the node from this frame on (e.g. "Search API" → "Query API"). */
  relabel?: { from: number; label: string }
}

export interface BEdge {
  a: string
  b: string
  /** Defaults to the later of the two nodes' `from`. */
  from?: number
  until?: number
  /** dashed: replication link; dotdash: the user-search flow in the web crawler diagram. */
  style?: 'dashed' | 'dotdash'
  /** Sideways bulge for edges that would otherwise cross a box. */
  bend?: number
  /** Waypoints for edges routed around boxes (takes precedence over `bend`). */
  via?: [number, number][]
}

export interface BGroup {
  id: string
  label: string
  nodes: string[]
  from: number
  until?: number
  /** Draw a dashed link from this group to another group (as the AWS diagram links SQL to sharding/federation). */
  linkTo?: string[]
}

/** A hop of a Step 3 use case: a message from one component to another, explained by one README line. */
export type Hop = [from: string, to: string, line: number]

export interface Flow {
  title: string
  /** Line of the "### Use case: …" heading (or the sentence that introduces it). */
  line: number
  hops: Hop[]
  /** Frame the flow plays on; defaults to the Step 3 frame. */
  frame?: number
}

/** A back-of-the-envelope figure recomputed from the stated inputs and compared with the figure the Primer states. */
export interface MathCheck {
  label: string
  /** How the value is computed, in words. */
  formula: string
  /** Recomputed value, in `unit`. */
  value: number
  /** The value the Primer states, in `unit`. */
  stated: number
  unit: 'B' | 'req/s' | 'count'
  /** Line where the Primer states the figure; must contain `statedText`. */
  line: number
  statedText: string
  /** Lines the inputs come from. */
  inputs: number[]
}

/** A Step 4 addition: the nodes it adds and the README line that gives the reason. */
export interface Addition {
  nodes: string[]
  line: number
  /** Primer topic ids to read for the trade-offs. */
  topics: string[]
  /** Frame the addition belongs to; defaults to the last frame. */
  frame?: number
}

export interface Builder {
  solutionId: string
  width: number
  height: number
  frames: Frame[]
  nodes: BNode[]
  edges: BEdge[]
  groups?: BGroup[]
  flows: Flow[]
  math: MathCheck[]
  additions: Addition[]
  /** Line-style legend, when the Primer's diagram has one. */
  legend?: { style: 'solid' | 'dashed' | 'dotdash'; label: string }[]
  /** Accuracy flags about the source diagrams (see docs/PLAN.md). */
  notes?: string[]
}

/** Standard frames for the seven problems that follow the 4-step template with two images. */
export const STANDARD_FRAMES = (basic: string, final: string): Frame[] => [
  { step: 1, label: 'Use cases & constraints' },
  {
    step: 2,
    label: 'High-level design',
    image: basic,
    note: 'Steps 2 and 3 together draw the Primer’s Step 2 diagram: the builder holds back the internal services until Step 3 describes them.',
  },
  { step: 3, label: 'Core components', image: basic },
  { step: 4, label: 'Scale the design', image: final },
]

export const KB = 1e3
export const MB = 1e6
export const GB = 1e9
export const TB = 1e12
export const PB = 1e15
/** The Primer's conversion: 2.5 million seconds per month. */
export const PER_MONTH = 2.5e6

export const n = (id: string, label: string, kind: NodeKind, x: number, y: number, from: number, o: Partial<BNode> = {}): BNode => ({ id, label, kind, x, y, from, ...o })
export const e = (a: string, b: string, o: Partial<BEdge> = {}): BEdge => ({ a, b, ...o })
