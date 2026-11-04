import type { SectionDocument, SectionNode } from '../lib/types.ts'
import { PrimerMarkdown } from './PrimerMarkdown.tsx'

const isBlank = (s: string) => s.trim().length === 0

/** Renders one section exactly as written: its heading, then its raw markdown body. */
export function SectionBody({
  doc,
  node,
  baseLevel,
  showHeading,
}: {
  doc: SectionDocument
  node: SectionNode
  baseLevel: number
  showHeading: boolean
}) {
  const rel = Math.min(6, 2 + node.level - baseLevel)
  const H = `h${rel}` as 'h2'
  return (
    <section id={`orig-${node.id}`} data-section-id={node.id}>
      {showHeading && <H className="scroll-mt-4">{node.title}</H>}
      {node.id === doc.rootId && !isBlank(doc.preamble) && <PrimerMarkdown markdown={doc.preamble} docPath={doc.source.path} />}
      {!isBlank(node.markdown) && <PrimerMarkdown markdown={node.markdown} docPath={doc.source.path} />}
    </section>
  )
}
