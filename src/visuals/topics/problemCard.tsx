import { Link } from 'react-router-dom'
import type { VisualProps } from '../registry.tsx'
import { solutionByReadmeTopic } from '../../lib/problems.ts'
import { SolutionThumb } from '../../solutions/ProblemThumb.tsx'
import type { SectionNode, TopicNode } from '../../lib/types.ts'
import { bullets } from '../auto.ts'
import { LineRef } from '../kit/Claims.tsx'

/** One problem: scope, usage math and the two diagrams, all from its solution file. */
export function ProblemCard({ node }: VisualProps) {
  const sol = solutionByReadmeTopic.get(node.id)
  if (!sol) return null
  const find = (pred: (n: SectionNode) => boolean) => sol.order.map((id) => sol.nodes[id]).find(pred)
  const scope = find((n) => /scope the problem/.test(n.title))
  const usage = find((n) => n.title === 'Calculate usage')
  const asTopic = (n: SectionNode) => n as unknown as TopicNode
  const withDoc = <T extends { claim: { doc?: string } }>(b: T) => ({ ...b, claim: { ...b.claim, doc: sol.source.path } })
  const scopeItems = scope ? bullets(asTopic(scope)).filter((b) => b.depth === 0).map(withDoc) : []
  const usageItems = usage ? bullets(asTopic(usage)).filter((b) => b.depth === 0).map(withDoc) : []
  const imgs = [
    { step: 2 as const, label: 'Step 2: high-level design' },
    { step: 4 as const, label: 'Step 4: scaled design' },
  ]
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2">
        {imgs.map((im) => {
          return (
            <figure key={im.step} className="m-0 overflow-hidden rounded-lg border border-line">
              <SolutionThumb id={sol.id} stage={im.step === 2 ? 'basic' : 'final'} />
              <figcaption className="border-t border-line px-2 py-1 text-[0.6875rem] text-muted">{im.label}</figcaption>
            </figure>
          )
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold">In scope</div>
          <ul className="flex flex-col gap-1 text-xs">
            {scopeItems.map((b, i) => (
              <li key={i}>
                · {b.claim.text}
                <LineRef claim={b.claim} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold">Back-of-the-envelope</div>
          <ul className="flex flex-col gap-1 text-xs">
            {usageItems.map((b, i) => (
              <li key={i}>
                · {b.claim.text}
                <LineRef claim={b.claim} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Link to={`/solutions/${sol.id}`} className="btn btn-primary self-start">
        Open the 4-step walkthrough →
      </Link>
    </div>
  )
}

