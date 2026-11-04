import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getVisual } from '../../content/visuals/index.ts'
import { getTopic, topics } from '../lib/content.ts'
import { VIA_PATH } from '../lib/journey.ts'
import { PATH_ORDER, pathPosition, PATH } from '../lib/learningPath.ts'
import { usePathCursor, useRead } from '../lib/progress.ts'
import { paragraphs } from '../visuals/auto.ts'
import { FocusMap } from '../map/FocusMap.tsx'
import { OutlineView } from '../map/OutlineView.tsx'
import { RadialMap } from '../map/RadialMap.tsx'
import { AreaChip } from '../topic/parts.tsx'

/** Shown on the home map: where to begin, or where you left off. */
function StartHere() {
  const read = useRead()
  const cursor = usePathCursor()
  const started = read.size > 0 && cursor !== null
  const target = cursor ?? PATH_ORDER[0]
  return (
    <div className="absolute right-3 bottom-16 z-10 max-w-[20rem] rounded-xl border border-line bg-surface/95 p-4 text-sm shadow-lg backdrop-blur md:top-3 md:bottom-auto">
      <div className="font-semibold">{started ? 'Pick up where you left off' : 'New to system design?'}</div>
      <p className="mt-1 text-xs text-muted">
        {started
          ? 'Your place on the learning path:'
          : 'Follow the learning path: the Primer’s own order, from the basics to practice. Or click any topic on the map.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link to={`/topic/${target}`} state={VIA_PATH} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
          {started ? topics.nodes[target].title : 'Start reading'} →
        </Link>
        <Link to="/path" className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
          See the whole path
        </Link>
      </div>
    </div>
  )
}

/** A short preview of the selected topic: enough to decide whether to read it. */
function Preview({ id, onClose }: { id: string; onClose: () => void }) {
  const node = topics.nodes[id]
  const v = getVisual(id)
  const lead = v?.summary?.text ?? paragraphs(node)[0]?.text
  const pos = pathPosition(id)
  const subs = node.childIds.filter((c) => topics.nodes[c].kind === 'topic').length
  const target = node.kind !== 'topic' && node.parentId ? node.parentId : id
  return (
    <aside
      aria-label="Topic preview"
      className="absolute inset-x-3 bottom-14 z-20 rounded-xl border border-line bg-surface p-4 shadow-lg md:inset-x-auto md:top-3 md:right-3 md:bottom-auto md:w-[22rem]"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg leading-snug font-semibold">{node.title}</h2>
        <button onClick={onClose} className="-mt-1 -mr-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close preview">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <AreaChip node={node} />
        {pos && PATH_ORDER.includes(id) && (
          <span>
            Learning path · stage {pos.stage.index + 1} of {PATH.length}
          </span>
        )}
      </div>
      {lead && <p className="mt-2 line-clamp-4 text-sm leading-relaxed">{lead}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link to={`/topic/${target}`} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
          Read this topic →
        </Link>
        {subs > 0 && <span className="text-xs text-muted">{subs} subtopics: they are around it on the map</span>}
      </div>
    </aside>
  )
}

type View = 'focus' | 'map' | 'outline'
const VIEWS: { value: View; label: string }[] = [
  { value: 'focus', label: 'Focus' },
  { value: 'map', label: 'Whole map' },
  { value: 'outline', label: 'Outline' },
]

function readView(): View {
  try {
    const v = localStorage.getItem('atlas-view-v2')
    return v === 'map' || v === 'outline' ? v : 'focus'
  } catch {
    return 'focus'
  }
}

/** The map is for finding your way: clicking a topic focuses it and shows a preview; reading happens on its page. */
export function MapPage() {
  const { id } = useParams()
  const node = getTopic(id)
  const navigate = useNavigate()
  const [view, setView] = useState<View>(readView)

  useEffect(() => {
    try {
      localStorage.setItem('atlas-view-v2', view)
    } catch {
      /* storage unavailable */
    }
  }, [view])

  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && navigate('/')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [node, navigate])

  const select = (nid: string) => navigate(`/map/${nid}`)
  return (
    <div className="relative flex min-h-0 flex-1">
      <section className="relative min-w-0 flex-1" aria-label="Topic map">
        <div className="absolute top-3 left-3 z-10 flex rounded-lg border border-line bg-surface/90 p-0.5 text-xs backdrop-blur" role="tablist">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              role="tab"
              aria-selected={view === v.value}
              onClick={() => setView(v.value)}
              className={`rounded-md px-2.5 py-1 ${view === v.value ? 'bg-surface-2 font-semibold' : 'text-muted hover:text-ink'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view === 'focus' ? (
          <FocusMap selectedId={node?.id} onSelect={select} />
        ) : view === 'map' ? (
          <RadialMap selectedId={node?.id} onSelect={select} />
        ) : (
          <div className="h-full pt-12">
            <OutlineView selectedId={node?.id} />
          </div>
        )}
      </section>
      {node ? <Preview id={node.id} onClose={() => navigate('/')} /> : id ? <p className="absolute top-14 left-3 text-sm">No topic with id “{id}”.</p> : <StartHere />}
    </div>
  )
}
