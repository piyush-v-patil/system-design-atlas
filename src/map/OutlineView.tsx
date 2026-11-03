import { Link } from 'react-router-dom'
import { areaColor, topics } from '../lib/content.ts'

/** Accessible, keyboard-friendly equivalent of the map: the same heading tree as nested lists. */
export function OutlineView({ selectedId }: { selectedId?: string }) {
  const render = (id: string) => {
    const n = topics.nodes[id]
    return (
      <li key={id}>
        <Link
          to={`/topic/${id}`}
          aria-current={id === selectedId ? 'page' : undefined}
          className={`flex items-center gap-2 rounded px-1.5 py-0.5 hover:bg-surface-2 ${id === selectedId ? 'bg-surface-2 font-semibold' : ''} ${n.kind !== 'topic' ? 'text-muted' : ''}`}
        >
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: areaColor(n.area) }} />
          {n.title}
        </Link>
        {n.childIds.length > 0 && <ul className="ml-3 border-l border-line pl-2">{n.childIds.map(render)}</ul>}
      </li>
    )
  }
  return (
    <nav aria-label="Topic outline" className="h-full overflow-y-auto p-4 text-sm">
      <ul>{render(topics.rootId)}</ul>
    </nav>
  )
}
