import { PATH_ORDER } from './learningPath.ts'
import { getPathCursor, markRead, setPathCursor } from './progress.ts'
import { topics } from './content.ts'

/**
 * Following the learning path. Reaching the next stop in order (or arriving through a "next on your path" link)
 * moves the reader's place on the path; anything else is a detour, and the page offers the way back.
 */
export function visitTopic(id: string, viaPath: boolean) {
  markRead(id)
  // Short sections shown inline on their parent's page (sources, disadvantages) count as read with it.
  for (const c of topics.nodes[id]?.childIds ?? []) if (topics.nodes[c].kind !== 'topic') markRead(c)
  const pos = PATH_ORDER.indexOf(id)
  if (pos < 0) return
  const cur = getPathCursor()
  const curPos = cur ? PATH_ORDER.indexOf(cur) : -1
  if (viaPath || cur === null || pos === curPos + 1) setPathCursor(id)
}

/** True when the reader has a place on the path and this page is not it (nor the stop right after it). */
export function isDetour(id: string, cursor: string | null): boolean {
  if (!cursor || cursor === id) return false
  const pos = PATH_ORDER.indexOf(id)
  return pos < 0 || pos !== PATH_ORDER.indexOf(cursor) + 1
}

/** Router state that marks a link as "following the path". */
export const VIA_PATH = { viaPath: true } as const
