/**
 * Hand-written visual metadata, keyed by topic id. Lives apart from the generated source text and never edits it.
 * Every claim cites the source lines it is based on and says whether it quotes or paraphrases the Primer.
 * tests/visuals.test.ts verifies that every quoted claim appears verbatim (modulo markdown formatting and
 * whitespace) within its cited lines.
 */
export interface Claim {
  text: string
  basis: 'quoted' | 'paraphrased'
  /** 1-based inclusive line range in `doc` (default README.md). */
  lines: [number, number]
  doc?: string
}

export type DiagramType = 'comparison' | 'process' | 'simulation' | 'calculator' | 'anatomy' | 'reference' | 'guide'

/** One step of an animated process; `source` is the line of Primer text the step highlights. */
export interface ProcessStep {
  caption: string
  source: Claim
}

export interface ComparisonColumn {
  key: string
  title: string
  /** Topic card the column links to. */
  topicId?: string
}

export interface Comparison {
  title?: string
  columns: ComparisonColumn[]
  rows: { label: string; cells: Record<string, Claim | null> }[]
  chooseWhen?: Record<string, Claim>
}

export interface TopicVisual {
  topicId: string
  diagram: DiagramType
  /** Component key resolved by src/visuals/registry.tsx. */
  component?: string
  /** Extra props for the component (e.g. which mode to start in). */
  props?: Record<string, string | number | boolean>
  /** Animated steps (for process components). */
  steps?: ProcessStep[]
  /** Alternative step sets keyed by mode (e.g. CP vs AP). */
  stepsByMode?: Record<string, ProcessStep[]>
  comparison?: Comparison
  /** A lead sentence from the source shown above the visual. */
  summary?: Claim
  /** Extra quoted points shown under a key-points visual. */
  points?: Claim[]
  /** Small multiples / hub tiles linking to subtopics, each with a quoted one-liner. */
  tiles?: { topicId: string; claim: Claim }[]
  useWhen?: Claim
  pros?: Claim[]
  cons?: Claim[]
  related?: string[]
  /** Notes about the source itself (accuracy flags from docs/PLAN.md), shown on the card. */
  notes?: string[]
}

/** Small helpers so metadata files stay readable. */
export const q = (text: string, from: number, to = from, doc?: string): Claim => ({ text, basis: 'quoted', lines: [from, to], ...(doc ? { doc } : {}) })
export const p = (text: string, from: number, to = from, doc?: string): Claim => ({ text, basis: 'paraphrased', lines: [from, to], ...(doc ? { doc } : {}) })
