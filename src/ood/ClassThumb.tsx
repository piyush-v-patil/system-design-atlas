import { classDiagrams } from '../../content/class-diagrams/index.ts'
import { oods } from '../lib/problems.ts'
import { box } from '../solutions/ProblemThumb.tsx'
import { ClassDiagram } from './ClassDiagram.tsx'
import { parsePython } from './parsePython.ts'

/** An object-oriented design problem pictured by its class diagram. */
export function ClassThumb({ id }: { id: string }) {
  const ood = oods.find((o) => o.id === id)
  const code = ood?.cells.find((c) => c.cellType === 'code' && /^class /m.test(c.source))?.source
  if (!code) return null
  return (
    <div className={box}>
      <ClassDiagram classes={parsePython(code)} associations={classDiagrams[id]?.associations ?? []} selected={null} onSelect={() => {}} title={`${id} class diagram`} thumb />
    </div>
  )
}
