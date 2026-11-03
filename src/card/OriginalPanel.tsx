import { useRef, useState } from 'react'
import { useOriginalHighlight } from '../visuals/kit/highlight.tsx'
import type { SectionDocument, SectionNode } from '../lib/types.ts'
import { githubBlob } from '../lib/content.ts'
import { PrimerMarkdown } from './PrimerMarkdown.tsx'

function collect(doc: SectionDocument, id: string, withChildren: boolean): SectionNode[] {
  const out = [doc.nodes[id]]
  if (withChildren) for (const c of doc.nodes[id].childIds) out.push(...collect(doc, c, true))
  return out
}

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

/**
 * The "Original" layer: the full source text for a node, rendered from the Primer's markdown. Expandable on every
 * card; can include all subsections to read the section exactly as it appears in the Primer.
 */
export function OriginalPanel({
  doc,
  nodeId,
  defaultOpen = true,
}: {
  doc: SectionDocument
  nodeId: string
  defaultOpen?: boolean
}) {
  const node = doc.nodes[nodeId]
  const ownEmpty = isBlank(node.markdown) && !(nodeId === doc.rootId && !isBlank(doc.preamble))
  const hasChildren = node.childIds.length > 0
  const [withChildren, setWithChildren] = useState(ownEmpty && hasChildren)
  const sections = collect(doc, nodeId, withChildren)
  const last = sections[sections.length - 1]
  const lines: [number, number] = [node.sourceLines[0], last.sourceLines[1]]
  const subCount = collect(doc, nodeId, true).length - 1
  const articleRef = useRef<HTMLElement>(null)
  useOriginalHighlight(articleRef, [nodeId, withChildren])

  return (
    <details open={defaultOpen} className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold select-none hover:bg-surface-2">
        <svg aria-hidden className="size-4 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 3l5 5-5 5z" />
        </svg>
        Original text
        <span className="font-normal text-muted">· The System Design Primer</span>
      </summary>
      <div className="border-t border-line px-4 pt-3 pb-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <a className="underline-offset-2 hover:underline" href={githubBlob(doc.source.path, lines)} target="_blank" rel="noopener noreferrer">
            {doc.source.path} · lines {lines[0]}–{lines[1]} ↗
          </a>
          {hasChildren && (
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" className="accent-[var(--accent)]" checked={withChildren} onChange={(e) => setWithChildren(e.target.checked)} />
              Include {subCount} subsection{subCount === 1 ? '' : 's'}
            </label>
          )}
        </div>
        {ownEmpty && !withChildren ? (
          <p className="text-sm text-muted italic">
            This heading has no text of its own in the Primer; its content is in the subsections.
          </p>
        ) : (
          <article ref={articleRef} className="primer prose prose-sm max-w-none">
            {sections.map((s, i) => (
              <SectionBody key={s.id} doc={doc} node={s} baseLevel={node.level} showHeading={i > 0} />
            ))}
          </article>
        )}
      </div>
    </details>
  )
}
