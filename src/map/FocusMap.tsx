import { useEffect, useMemo, useRef, useState } from 'react'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import 'd3-transition'
import { AREA_LABEL, areaColor, topics } from '../lib/content.ts'
import { focusFor, layoutFocus, type FocusNode } from './focusLayout.ts'

const TWO_SIDED_MIN = 640

function NodeMark({ n, selected, onSelect }: { n: FocusNode; selected: boolean; onSelect: (id: string) => void }) {
  const color = areaColor(n.node.area)
  const satellite = n.node.kind !== 'topic'
  const anchor = n.side === 1 ? 'start' : 'end'
  const go = () => onSelect(n.id)
  const common = {
    className: 'fnode',
    'data-node-id': n.id,
    role: 'link',
    tabIndex: 0,
    'aria-label': n.node.headingPath.slice(1).join(' › ') || n.node.title,
    onClick: go,
    onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go()),
    style: { transform: `translate(${n.x}px, ${n.y}px)` },
  }

  if (n.role === 'focus') {
    const w = n.labelW
    return (
      <g {...common}>
        <title>{n.node.title}</title>
        <rect x={-w / 2} y={-18} width={w} height={36} rx={18} fill={color} stroke={selected ? 'var(--accent)' : 'var(--surface)'} strokeWidth={selected ? 3 : 2} />
        <text y={4.5} textAnchor="middle" fontSize={13.5} fontWeight={700} className="focus-label">
          {n.label}
        </text>
      </g>
    )
  }
  if (n.role === 'parent') {
    const w = n.labelW
    return (
      <g {...common}>
        <title>{`Up to ${n.node.title}`}</title>
        <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill="var(--surface)" stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
        <text y={4} textAnchor="middle" fontSize={11} className="muted">
          ↑ {n.label}
        </text>
      </g>
    )
  }
  const small = n.role === 'grandchild'
  const r = small ? (satellite ? 2.6 : 3.6) : satellite ? 3.4 : 5.5
  const tx = n.side * (r + 7)
  const fs = small ? 11 : 12.5
  const pillX = n.side === 1 ? tx + n.labelW + 2 : tx - n.labelW - 30
  return (
    <g {...common}>
      <title>{n.node.headingPath.slice(1).join(' › ')}</title>
      <rect x={n.side === 1 ? -r - 4 : -n.labelW - r - 12} y={-11} width={n.labelW + r + 16} height={22} fill="transparent" />
      {selected && <circle r={r + 5} fill="none" stroke="var(--accent)" strokeWidth={2.5} />}
      <circle r={r} fill={satellite ? 'var(--surface)' : color} stroke={color} strokeWidth={satellite ? 1.5 : 1} />
      <text x={tx} y={4} textAnchor={anchor} fontSize={fs} fontWeight={small ? 400 : 600} className={satellite ? 'muted' : undefined}>
        {n.label}
      </text>
      {n.hidden > 0 && (
        <g transform={`translate(${pillX},-8)`}>
          <rect width={28} height={16} rx={8} fill="var(--surface-2)" stroke={color} strokeWidth={1} />
          <text x={14} y={11.5} fontSize={9.5} fontWeight={600} textAnchor="middle">
            +{n.hidden}
          </text>
        </g>
      )}
    </g>
  )
}

/** `selectedId` is the topic the map centres on; `markId` (default: the same) is the one drawn as "you are here". */
export function FocusMap({ selectedId, onSelect, markId }: { selectedId?: string; onSelect: (id: string) => void; markId?: string }) {
  const mark = markId ?? selectedId
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const focusId = focusFor(topics, selectedId)
  const twoSided = size.w >= TWO_SIDED_MIN
  /** Scale at which a layout would fit the pane (before clamping). */
  const fitScale = (b: { x0: number; y0: number; x1: number; y1: number }) => Math.min((size.w - 48) / (b.x1 - b.x0), (size.h - 116) / (b.y1 - b.y0))
  const layout = useMemo(() => {
    const full = layoutFocus(topics, focusId, { twoSided, maxGrandchildren: twoSided ? 60 : 24 })
    // Keep text readable: if drawing grandchildren would shrink the map too far, collapse them into +N pills.
    if (full.showGrandchildren && fitScale(full.bounds) < 0.78) return layoutFocus(topics, focusId, { twoSided, maxGrandchildren: 0 })
    return full
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, twoSided, size.w, size.h])
  const focus = topics.nodes[focusId]

  useEffect(() => {
    const svg = svgRef.current!
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 3])
      .on('zoom', (e) => gRef.current?.setAttribute('transform', e.transform.toString()))
    zoomRef.current = z
    select(svg).call(z).on('dblclick.zoom', null)
    return () => {
      select(svg).on('.zoom', null)
    }
  }, [])

  // Fit the current focus into view whenever it (or the pane size) changes.
  const fit = (animate: boolean) => {
    if (!zoomRef.current || size.w === 0) return
    const { x0, y0, x1, y1 } = layout.bounds
    const top = 52 // room for the breadcrumb bar
    const pad = 24
    const availW = size.w - pad * 2
    const availH = size.h - top - pad - 40
    let k: number
    let ty: number
    if (twoSided) {
      k = Math.max(0.3, Math.min(1.25, availW / (x1 - x0), availH / (y1 - y0)))
      ty = top + (availH + pad) / 2 - ((y0 + y1) / 2) * k + 6
    } else {
      // Narrow panes: fit the width but never shrink text below a readable size; drag to see the rest.
      k = Math.max(0.82, Math.min(1.15, availW / (x1 - x0)))
      const fitsHeight = (y1 - y0) * k <= availH
      ty = fitsHeight ? top + (availH + pad) / 2 - ((y0 + y1) / 2) * k + 6 : top + 10 - y0 * k
    }
    const tx = twoSided ? size.w / 2 - ((x0 + x1) / 2) * k : Math.max(pad - x0 * k, size.w / 2 - ((x0 + x1) / 2) * k)
    const t = zoomIdentity.translate(tx, ty).scale(k)
    const sel = select(svgRef.current!)
    if (animate) sel.transition().duration(450).call(zoomRef.current.transform, t)
    else sel.call(zoomRef.current.transform, t)
  }
  const first = useRef(true)
  useEffect(() => {
    fit(!first.current)
    first.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, size.w, size.h])

  const zoomBy = (f: number) => select(svgRef.current!).transition().duration(250).call(zoomRef.current!.scaleBy, f)

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <nav aria-label="Map position" className="absolute top-12 right-3 left-3 z-10 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-muted">
        {focus.pathIds.map((id, i) => {
          const n = topics.nodes[id]
          const last = i === focus.pathIds.length - 1
          return (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>›</span>}
              {last ? (
                <span className="font-semibold text-ink">{i === 0 ? 'Home' : n.title}</span>
              ) : (
                <button className="hover:text-ink hover:underline" onClick={() => onSelect(id)}>
                  {i === 0 ? 'Home' : n.title}
                </button>
              )}
            </span>
          )
        })}
        <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-px text-[10px]">
          <span aria-hidden className="size-1.5 rounded-full" style={{ background: areaColor(focus.area) }} />
          {AREA_LABEL[focus.area]}
        </span>
      </nav>

      <svg ref={svgRef} className="map-svg focus-map block h-full w-full" width={size.w} height={size.h} role="group" aria-label={`Map centred on ${focus.title}`}>
        <g ref={gRef}>
          <g fill="none">
            {layout.links.map((l) => {
              const tn = topics.nodes[l.target]
              const on = mark === l.target
              return (
                <path
                  key={`${layout.focusId}-${l.id}`}
                  className="flink"
                  d={l.d}
                  stroke={on ? 'var(--accent)' : areaColor(tn.area)}
                  strokeOpacity={on ? 1 : l.role === 'parent' ? 0.5 : l.role === 'child' ? 0.6 : 0.4}
                  strokeWidth={on ? 2.4 : l.role === 'child' ? 1.8 : 1.2}
                  strokeDasharray={l.role === 'parent' ? '4 4' : undefined}
                />
              )
            })}
          </g>
          {layout.nodes.map((n) => (
            <NodeMark key={n.id} n={n} selected={mark === n.id} onSelect={onSelect} />
          ))}
        </g>
      </svg>

      {!layout.showGrandchildren && layout.nodes.some((n) => n.hidden > 0) && (
        <p className="pointer-events-none absolute bottom-3 left-3 hidden rounded-md bg-surface/90 px-2 py-1 text-[11px] text-muted sm:block">
          +N = subtopics. Click a topic to open it.
        </p>
      )}
      <div className="absolute right-3 bottom-3 hidden flex-col overflow-hidden rounded-lg border border-line bg-surface/90 text-sm backdrop-blur sm:flex">
        <button className="px-2.5 py-1.5 hover:bg-surface-2" onClick={() => zoomBy(1.3)} aria-label="Zoom in">
          +
        </button>
        <button className="border-t border-line px-2.5 py-1.5 hover:bg-surface-2" onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out">
          −
        </button>
        <button className="border-t border-line px-2.5 py-1.5 text-xs hover:bg-surface-2" onClick={() => fit(true)} aria-label="Fit map to screen">
          Fit
        </button>
      </div>
    </div>
  )
}
