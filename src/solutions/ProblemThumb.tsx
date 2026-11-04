import { getBuilder } from '../../content/builders/index.ts'
import { ArchitectureCanvas } from './ArchitectureCanvas.tsx'
import { firstFrameOfStep } from './geometry.ts'

export const box = 'thumb aspect-[4/3] overflow-hidden bg-bg/60 p-2'

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

