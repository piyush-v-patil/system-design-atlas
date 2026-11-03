import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from 'react'

/** Lets an animation tell the Original panel which source sentence the current step corresponds to. */
const Ctx = createContext<{ text: string | null; setText: (t: string | null) => void }>({ text: null, setText: () => {} })

export function StepHighlightProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null)
  return <Ctx.Provider value={{ text, setText }}>{children}</Ctx.Provider>
}

export const useStepHighlight = () => useContext(Ctx)

/** Find `needle` in the text under `root`, ignoring whitespace differences. */
function findRange(root: Node, needle: string): Range | null {
  const want = needle.replace(/\s+/g, ' ').trim()
  if (!want) return null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let flat = ''
  const map: { node: Text; offset: number }[] = []
  let lastSpace = true
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const v = n.data
    for (let i = 0; i < v.length; i++) {
      const isSpace = /\s/.test(v[i])
      if (isSpace && lastSpace) continue
      flat += isSpace ? ' ' : v[i]
      map.push({ node: n, offset: i })
      lastSpace = isSpace
    }
  }
  const at = flat.indexOf(want)
  if (at < 0) return null
  const a = map[at]
  const b = map[at + want.length - 1]
  const r = document.createRange()
  r.setStart(a.node, a.offset)
  r.setEnd(b.node, b.offset + 1)
  return r
}

/** Highlights the active step's sentence inside the Original panel (CSS Custom Highlight API, where supported). */
export function useOriginalHighlight(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
  const { text } = useStepHighlight()
  useEffect(() => {
    const reg = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights
    const HighlightCtor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight
    if (!reg || !HighlightCtor) return
    reg.delete('atlas-step')
    if (!text || !ref.current) return
    const range = findRange(ref.current, text)
    if (range) reg.set('atlas-step', new HighlightCtor(range))
    return () => {
      reg.delete('atlas-step')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, ...deps])
}
