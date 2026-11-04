import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import 'd3-transition'
import { arc as d3arc, linkRadial } from 'd3-shape'
import type { Area } from '../lib/types.ts'
import { AREAS } from '../lib/types.ts'
import { AREA_LABEL, areaColor, topics } from '../lib/content.ts'
import { BAND_R, layoutMap, RIM_FAR, RIM_NEAR, type LaidOutNode } from './mapData.ts'

/** Zoom thresholds: ≥ DETAIL_K shows leaf labels; ≥ DEEP_K also shows internal-node labels. */
const DETAIL_K = 0.9
const DEEP_K = 1.6

const linkPath = linkRadial<{ source: LaidOutNode; target: LaidOutNode }, LaidOutNode>()
  .angle((d) => d.angle)
  .radius((d) => d.radius)

const rimArc = d3arc<{ lo: number; hi: number }>()
  .innerRadius(BAND_R - 3)
  .outerRadius(BAND_R + 3)
  .startAngle((d) => d.lo)
  .endAngle((d) => d.hi)
  .cornerRadius(3)

function radialLabel(angle: number, r: number) {
  const deg = (angle * 180) / Math.PI - 90
  const flip = angle > Math.PI
  return { transform: `rotate(${deg}) translate(${r},0)${flip ? ' rotate(180)' : ''}`, anchor: flip ? 'end' : 'start' } as const
}

const truncate = (s: string, n = 34) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

function dotRadius(n: LaidOutNode) {
  if (n.node.level === 0) return 8
  if (n.node.level === 1) return 6
  return n.node.kind === 'topic' ? 4 : 2.6
}

export function RadialMap({
  selectedId,
  readIds,
  onSelect,
}: {
  selectedId?: string
  readIds?: Set<string>
  onSelect: (id: string) => void
}) {
  const layout = useMemo(() => layoutMap(topics), [])
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout])
  const sectors = useMemo(
    () =>
      layout.nodes
        .filter((n) => n.node.level === 1)
        .map((h) => {
          const angles = layout.nodes.filter((n) => n.node.pathIds[1] === h.id).map((n) => n.angle)
          const lo = Math.min(...angles)
          const hi = Math.max(...angles)
          const pad = 0.012
          return { id: h.id, area: h.node.area, title: h.node.title, lo: lo - pad, hi: hi + pad, mid: (lo + hi) / 2 }
        }),
    [layout],
  )

  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const interacted = useRef(false)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [hover, setHover] = useState<string | null>(null)
  const [focusArea, setFocusArea] = useState<Area | null>(null)

  // Track container size.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fitTransform = (w: number, h: number) => {
    // H2 names are drawn at a fixed screen size (13px / k), so reserve a constant pixel margin for them.
    const half = Math.min(w, h) / 2
    const labelPx = Math.min(215, w < 640 ? 150 : half * 0.45)
    const k = Math.max(0.12, (half - labelPx) / RIM_NEAR)
    return zoomIdentity.translate(w / 2, h / 2).scale(k)
  }

  // Set up d3-zoom once.
  useEffect(() => {
    const svg = svgRef.current!
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (e) => {
        const t = e.transform as ZoomTransform
        transformRef.current = t
        if (e.sourceEvent) interacted.current = true
        gRef.current?.setAttribute('transform', t.toString())
        svg.style.setProperty('--k', String(t.k))
        svg.style.setProperty('--kc', String(Math.min(t.k, 1)))
        svg.dataset.detail = t.k >= DEEP_K ? '2' : t.k >= DETAIL_K ? '1' : '0'
      })
    zoomRef.current = z
    select(svg).call(z).on('dblclick.zoom', null)
    return () => {
      select(svg).on('.zoom', null)
    }
  }, [])

  // Fit on first layout and on resize until the user has panned/zoomed.
  useEffect(() => {
    if (!zoomRef.current || interacted.current || size.w === 0) return
    select(svgRef.current!).call(zoomRef.current.transform, fitTransform(size.w, size.h))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h])

  // Bring the selected node into view if it is outside the viewport.
  useEffect(() => {
    const n = selectedId ? byId.get(selectedId) : undefined
    if (!n || !zoomRef.current) return
    const t = transformRef.current
    const [sx, sy] = t.apply([n.x, n.y])
    const m = 40
    if (sx > m && sy > m && sx < size.w - m && sy < size.h - m) return
    select(svgRef.current!).transition().duration(450).call(zoomRef.current.translateTo, n.x, n.y)
  }, [selectedId, byId, size.w, size.h])

  const zoomBy = (f: number) => select(svgRef.current!).transition().duration(250).call(zoomRef.current!.scaleBy, f)
  const fit = () => {
    interacted.current = false
    select(svgRef.current!).transition().duration(350).call(zoomRef.current!.transform, fitTransform(size.w, size.h))
  }

  const active = hover ?? selectedId
  const activePath = new Set(active ? (topics.nodes[active]?.pathIds ?? []) : [])

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        className="map-svg block h-full w-full"
        width={size.w}
        height={size.h}
        role="group"
        aria-label="Mind map of every topic in The System Design Primer"
        data-detail="0"
        style={{ '--k': 1, '--kc': 1 } as CSSProperties}
      >
        <g ref={gRef}>
          {/* Area bands and H2 names on the rim (overview). */}
          <g className="rim">
            {sectors.map((s) => {
              const near = radialLabel(s.mid, RIM_NEAR)
              const far = radialLabel(s.mid, RIM_FAR)
              const dim = focusArea && focusArea !== s.area
              const label = truncate(s.title, 30)
              return (
                <g key={s.id} className={dim ? 'dim' : ''} onClick={() => onSelect(s.id)} style={{ cursor: 'pointer' }}>
                  <title>{s.title}</title>
                  <path d={rimArc(s) ?? ''} fill={areaColor(s.area)} opacity={0.9} />
                  <text className="lbl-h2 lbl-rim-near" transform={near.transform} textAnchor={near.anchor} dominantBaseline="central">
                    {label}
                  </text>
                  <text className="lbl-h2 lbl-rim-far" transform={far.transform} textAnchor={far.anchor} dominantBaseline="central">
                    {label}
                  </text>
                </g>
              )
            })}
          </g>

          <g fill="none" strokeLinecap="round">
            {layout.links.map(({ source, target }) => {
              const on = activePath.has(target.id)
              const dim = focusArea && focusArea !== target.node.area
              return (
                <path
                  key={target.id}
                  d={linkPath({ source, target }) ?? ''}
                  stroke={on ? 'var(--accent)' : areaColor(target.node.area)}
                  strokeOpacity={on ? 0.95 : dim ? 0.08 : 0.38}
                  strokeWidth={on ? 2.2 : target.node.kind === 'topic' ? 1.3 : 0.9}
                />
              )
            })}
          </g>

          {layout.nodes.map((n) => {
            const r = dotRadius(n)
            const isSel = n.id === selectedId
            const dim = focusArea && focusArea !== n.node.area
            const read = readIds?.has(n.id)
            const satellite = n.node.kind !== 'topic'
            const leafLbl = radialLabel(n.angle, r + 5)
            const level = n.node.level
            return (
              <g
                key={n.id}
                className={`node${dim ? ' dim' : ''}`}
                data-node-id={n.id}
                data-area={n.node.area}
                transform={`translate(${n.x},${n.y})`}
                tabIndex={level <= 1 ? 0 : -1}
                role="link"
                aria-label={n.node.headingPath.slice(1).join(' › ') || n.node.title}
                onClick={() => onSelect(n.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(n.id))}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                <title>{n.node.headingPath.slice(1).join(' › ') || n.node.title}</title>
                <circle r={r + 7} fill="transparent" />
                {isSel && <circle r={r + 5} fill="none" stroke="var(--accent)" strokeWidth={2.5} />}
                <circle
                  className="dot"
                  r={r}
                  fill={satellite ? 'var(--surface)' : areaColor(n.node.area)}
                  stroke={satellite ? areaColor(n.node.area) : read ? 'var(--text)' : 'var(--surface)'}
                  strokeWidth={satellite ? 1.4 : read ? 1.8 : 1.2}
                />
                {level === 0 ? (
                  <text className="lbl-h2" y={26} textAnchor="middle">
                    {n.node.parentId ? n.node.title : 'System Design Atlas'}
                  </text>
                ) : n.isLeaf ? (
                  <text
                    className="lbl-deep"
                    transform={leafLbl.transform}
                    textAnchor={leafLbl.anchor}
                    dominantBaseline="central"
                    fontSize={satellite ? 9.5 : 11}
                    opacity={satellite ? 0.8 : 1}
                  >
                    {truncate(n.node.title)}
                  </text>
                ) : (
                  <text
                    className={`lbl-internal${activePath.has(n.id) ? ' on' : ''}`}
                    y={-r - 5}
                    textAnchor="middle"
                    fontWeight={level === 1 ? 600 : 500}
                  >
                    {truncate(n.node.title, 28)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Legend: hover or focus an area to highlight it. */}
      <ul className="absolute bottom-3 left-3 flex max-w-[calc(100%-6rem)] flex-wrap gap-x-3 gap-y-1 rounded-lg border border-line bg-surface/90 px-3 py-2 text-xs backdrop-blur">
        {AREAS.map((a) => (
          <li key={a}>
            <button
              className="flex items-center gap-1.5 rounded px-0.5 hover:text-ink"
              onMouseEnter={() => setFocusArea(a)}
              onMouseLeave={() => setFocusArea(null)}
              onFocus={() => setFocusArea(a)}
              onBlur={() => setFocusArea(null)}
            >
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: areaColor(a) }} />
              {AREA_LABEL[a]}
            </button>
          </li>
        ))}
      </ul>

      <div className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-lg border border-line bg-surface/90 text-sm backdrop-blur">
        <button className="px-2.5 py-1.5 hover:bg-surface-2" onClick={() => zoomBy(1.4)} aria-label="Zoom in">
          +
        </button>
        <button className="border-t border-line px-2.5 py-1.5 hover:bg-surface-2" onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out">
          −
        </button>
        <button className="border-t border-line px-2.5 py-1.5 text-xs hover:bg-surface-2" onClick={fit} aria-label="Fit map to screen">
          Fit
        </button>
      </div>
    </div>
  )
}
