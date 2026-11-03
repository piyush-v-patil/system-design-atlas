/**
 * Hand-written visual metadata, keyed by topic id. Lives apart from the generated source text and never edits it.
 * Every claim carries the source lines it is based on, and whether it quotes or paraphrases the Primer.
 */
export interface Claim {
  text: string
  basis: 'quoted' | 'paraphrased'
  /** 1-based inclusive line range in the source document. */
  lines: [number, number]
}

export type DiagramType = 'comparison' | 'process' | 'anatomy' | 'calculator' | 'reference' | 'guide'

export interface TopicVisual {
  topicId: string
  diagram: DiagramType
  /** Component key resolved by src/visuals/registry.tsx. */
  component?: string
  useWhen?: Claim
  pros?: Claim[]
  cons?: Claim[]
  related?: string[]
}
