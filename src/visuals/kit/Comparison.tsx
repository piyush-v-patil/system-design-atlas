import { Link } from 'react-router-dom'
import type { Comparison } from '../../../content/visuals/types.ts'
import { ClaimText } from './Claims.tsx'

/** Side-by-side comparison with a highlighted "choose when" row. Scrolls horizontally on narrow screens. */
export function ComparisonCard({ data, activeKey }: { data: Comparison; activeKey?: string }) {
  const cols = data.columns
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {data.title && <h3 className="border-b border-line px-4 py-2.5 text-sm font-semibold">{data.title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: cols.length * 150 + 110 }}>
          <thead>
            <tr>
              <th className="w-[110px]" />
              {cols.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`border-l border-line px-3 py-2 text-left align-bottom font-semibold ${activeKey === c.key ? 'bg-accent-soft' : ''}`}
                >
                  {c.topicId ? (
                    <Link to={`/topic/${c.topicId}`} className="text-link hover:underline">
                      {c.title}
                    </Link>
                  ) : (
                    c.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="px-3 py-2 text-left align-top text-xs font-semibold text-muted">
                  {r.label}
                </th>
                {cols.map((c) => (
                  <td key={c.key} className={`border-l border-line px-3 py-2 align-top leading-snug ${activeKey === c.key ? 'bg-accent-soft/50' : ''}`}>
                    {r.cells[c.key] ? <ClaimText claim={r.cells[c.key]!} /> : <span className="text-muted">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {data.chooseWhen && (
              <tr className="border-t-2 border-[var(--accent)]/50 bg-accent-soft/40">
                <th scope="row" className="px-3 py-2.5 text-left align-top text-xs font-semibold text-[var(--accent)] uppercase">
                  Choose when
                </th>
                {cols.map((c) => (
                  <td key={c.key} className="border-l border-line px-3 py-2.5 align-top leading-snug font-medium">
                    {data.chooseWhen![c.key] ? <ClaimText claim={data.chooseWhen![c.key]} /> : <span className="text-muted">—</span>}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
