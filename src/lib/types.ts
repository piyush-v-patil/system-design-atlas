// Shared content types: produced by scripts/, consumed by src/ and tests/.

export const AREAS = [
  'fundamentals',
  'networking',
  'data',
  'caching',
  'async',
  'communication',
  'security',
  'appendix',
  'guide',
] as const
export type Area = (typeof AREAS)[number]

/** "disadvantages" / "sources" headings are satellites on the map. */
export type NodeKind = 'topic' | 'disadvantages' | 'sources'

export interface SourceRef {
  repo: string
  commit: string
  /** Path inside the Primer repo, e.g. "README.md". */
  path: string
}

/** One heading and the raw markdown that follows it, up to the next heading of any level. */
export interface SectionNode {
  id: string
  title: string
  /** Markdown heading level, 1–6. */
  depth: number
  /** Depth in the tree (root = 0). Differs from `depth` where the source skips levels. */
  level: number
  /** Position in source order (0 = first heading). */
  order: number
  parentId: string | null
  childIds: string[]
  /** Titles from the root down to and including this node. */
  headingPath: string[]
  /** Ids from the root down to and including this node. */
  pathIds: string[]
  /** The raw heading line, e.g. "### CAP theorem" (byte-exact). */
  headingMarkdown: string
  /** Raw markdown between this heading and the next heading (byte-exact, may be whitespace only). */
  markdown: string
  /** 1-based inclusive line range covering the heading line and its body. */
  sourceLines: [number, number]
  /** Absolute and relative link/image targets found in this node's own body. */
  urls: string[]
  /** Image references found in this node's own body (as written in the source). */
  images: string[]
}

export interface TopicNode extends SectionNode {
  area: Area
  kind: NodeKind
}

export interface SectionDocument<N extends SectionNode = SectionNode> {
  source: SourceRef
  /** Raw markdown before the first heading (byte-exact). */
  preamble: string
  rootId: string
  /** Node ids in source order. */
  order: string[]
  nodes: Record<string, N>
}

export type TopicsFile = SectionDocument<TopicNode>

export interface SolutionStep {
  /** 1–4 for the interview steps; 5 for "Additional talking points". */
  step: 1 | 2 | 3 | 4 | 5
  label: string
  nodeId: string
}

export interface SolutionFile extends SectionDocument {
  id: string
  /** Folder name under solutions/system_design. */
  dir: string
  /** The H1 inside the solution README. */
  title: string
  /** The question text as written in the main README's table. */
  readmeTitle: string
  /** The README topic node that introduces this problem. */
  readmeTopicId: string
  steps: SolutionStep[]
}

export interface NotebookCell {
  cellType: 'markdown' | 'code' | 'raw'
  /** Cell source, joined exactly as stored in the notebook. */
  source: string
  /** Text outputs (stream / execute_result text/plain), joined exactly. */
  outputs: string[]
}

export interface OodFile {
  id: string
  dir: string
  source: SourceRef
  title: string
  readmeTitle: string
  cells: NotebookCell[]
  /** The notebook converted to markdown: markdown cells verbatim, code as fenced blocks. */
  markdown: string
  /** The sibling .py module, which differs slightly from the notebook (see docs/PLAN.md F8). */
  module: { path: string; code: string } | null
  urls: string[]
}

export interface ImageCredit {
  text: string
  url: string
}

export interface ImageEntry {
  /** The reference exactly as written in the source (relative path or absolute URL). */
  ref: string
  /** Path under public/, e.g. "images/bgLMI2u.png". */
  src: string
  /** Where the bytes came from. */
  origin: 'primer-images' | 'solution-folder' | 'remote'
  /** For remote images: the URL the file was vendored from. */
  vendoredFrom?: string
  /** Source files that reference it. */
  referencedIn: string[]
  /** Caption text written next to the image in the source, if any. */
  caption: string | null
  /** Per-image "Source: …" credit from the source, if any. */
  credit: ImageCredit | null
}

export interface ImagesFile {
  entries: Record<string, ImageEntry>
  /** Files copied from the Primer that no document references (kept, listed for transparency). */
  unreferenced: string[]
}

export interface ContentMeta {
  repo: string
  commit: string
  license: { name: string; url: string }
  generatedFrom: string[]
}
