import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

/**
 * Full screen for one element. Uses the browser's Fullscreen API where it exists; where it does not (iPhone Safari
 * only allows it for video), the element is pinned over the page instead and Esc still closes it.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false)
  const [pinned, setPinned] = useState(false)
  useEffect(() => {
    const onChange = () => setNative(!!ref.current && document.fullscreenElement === ref.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [ref])
  useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false)
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [pinned])
  const toggle = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (native) void document.exitFullscreen?.()
    else if (pinned) setPinned(false)
    else if (document.fullscreenEnabled && el.requestFullscreen) el.requestFullscreen().catch(() => setPinned(true))
    else setPinned(true)
  }, [ref, native, pinned])
  return { active: native || pinned, pinned, toggle }
}

export function FullscreenButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} title={active ? 'Exit full screen (Esc)' : 'Full screen'} className="btn btn-sm btn-ghost shrink-0">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {active ? <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" /> : <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />}
      </svg>
      <span className="hidden sm:inline">{active ? 'Exit full screen' : 'Full screen'}</span>
    </button>
  )
}

/**
 * While `active`, lays the children out at a fixed width and scales them up (or down) to fill the space available,
 * so a diagram and the controls drawn inside it grow together. Inactive, it is a plain wrapper. The element tree is
 * the same either way, so switching does not reset the animation.
 */
export function FitBox({ active, children, width = '46rem' }: { active: boolean; children: ReactNode; width?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<{ s: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    if (!active) {
      setFit(null)
      return
    }
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const measure = () => {
      const w = i.offsetWidth
      const h = i.offsetHeight
      if (!w || !h || !o.clientWidth || !o.clientHeight) return
      const s = Math.max(0.4, Math.min(o.clientWidth / w, o.clientHeight / h, 3))
      setFit((p) => (p && Math.abs(p.s - s) < 0.001 && p.w === w && p.h === h ? p : { s, w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(o)
    ro.observe(i)
    return () => ro.disconnect()
  }, [active])
  return (
    <div ref={outer} className={active ? 'flex min-h-0 flex-1 items-center justify-center overflow-hidden' : undefined}>
      <div style={active && fit ? { width: fit.w * fit.s, height: fit.h * fit.s } : undefined}>
        <div ref={inner} style={active ? { width, transform: fit ? `scale(${fit.s})` : undefined, transformOrigin: '0 0' } : undefined}>
          {children}
        </div>
      </div>
    </div>
  )
}
