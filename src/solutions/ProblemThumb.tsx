import { getBuilder } from '../../content/builders/index.ts'
import { classDiagrams } from '../../content/class-diagrams/index.ts'
import { oods } from '../lib/content.ts'
import { ClassDiagram } from '../ood/ClassDiagram.tsx'
import { parsePython } from '../ood/parsePython.ts'
import { ArchitectureCanvas } from './ArchitectureCanvas.tsx'
import { firstFrameOfStep } from './geometry.ts'

const box = 'thumb aspect-[4/3] overflow-hidden bg-bg/60 p-2'

/** A system design problem pictured by its own architecture diagram: the scaled design, or the Step 3 design. */
export function SolutionThumb({ id, stage = 'final' }: { id: string; stage?: 'basic' | 'final' }) {
  const b = getBuilder(id)
  if (!b) return null
  const frame = stage === 'final' ? b.frames.length - 1 : firstFrameOfStep(b, 3)
  return (
    <div className={box}>
      <ArchitectureCanvas builder={b} frame={frame} title={`${id} architecture`} thumb />
    </div>
  )
}

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
