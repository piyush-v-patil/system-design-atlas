import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopic } from '../lib/content.ts'
import { RadialMap } from '../map/RadialMap.tsx'
import { OutlineView } from '../map/OutlineView.tsx'
import { TopicCard } from '../card/TopicCard.tsx'

type View = 'map' | 'outline'

function readView(): View {
  try {
    return localStorage.getItem('atlas-view') === 'outline' ? 'outline' : 'map'
  } catch {
    return 'map'
  }
}

export function MapPage() {
  const { id } = useParams()
  const node = getTopic(id)
  const navigate = useNavigate()
  const [view, setView] = useState<View>(readView)
  const [wide, setWide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atlas-wide') === '1'
    } catch {
      return false
    }
  })
  const toggleWide = () =>
    setWide((w) => {
      try {
        localStorage.setItem('atlas-wide', w ? '0' : '1')
      } catch {
        /* storage unavailable */
      }
      return !w
    })
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem('atlas-view', view)
    } catch {
      /* storage unavailable */
    }
  }, [view])

  // Scroll the card to the top when switching topics.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && navigate('/')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [node, navigate])

  return (
    <div className="relative flex min-h-0 flex-1">
      <section className="relative min-w-0 flex-1" aria-label="Topic map">
        <div className="absolute top-3 left-3 z-10 flex rounded-lg border border-line bg-surface/90 p-0.5 text-xs backdrop-blur" role="tablist">
          {(['map', 'outline'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-2.5 py-1 capitalize ${view === v ? 'bg-surface-2 font-semibold' : 'text-muted hover:text-ink'}`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === 'map' ? (
          <RadialMap selectedId={node?.id} onSelect={(nid) => navigate(`/topic/${nid}`)} />
        ) : (
          <div className="h-full pt-12">
            <OutlineView selectedId={node?.id} />
          </div>
        )}
      </section>

      {id && !node && (
        <aside className="absolute inset-x-3 bottom-3 rounded-xl border border-line bg-surface p-4 text-sm shadow-lg md:static md:w-[420px] md:rounded-none md:border-y-0 md:border-r-0">
          No topic with id <code>{id}</code>.
        </aside>
      )}

      {node && (
        <aside
          ref={panelRef}
          aria-label="Topic card"
          className={`fixed inset-x-0 bottom-0 z-20 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] md:static md:z-auto md:max-h-none ${wide ? 'md:w-[min(1040px,72vw)]' : 'md:w-[min(620px,50vw)]'} md:shrink-0 md:rounded-none md:border-t-0 md:border-l md:shadow-none`}
        >
          <div aria-hidden className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
          <TopicCard node={node} onClose={() => navigate('/')} wide={wide} onToggleWide={toggleWide} />
        </aside>
      )}
    </div>
  )
}
