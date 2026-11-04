import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { bulletsAfter } from '../auto.ts'
import { Badge, Caption, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { LineRef } from '../kit/Claims.tsx'

type P = [number, number]

/** Where a cache can sit along a request's path; each layer links to its card. */
const LAYERS: { id: string; label: string; sub: string; kind: 'client' | 'server' | 'lb' | 'app' | 'db'; at: P; w: number }[] = [
  { id: 'client-caching', label: 'Client', sub: 'OS / browser', kind: 'client', at: [50, 168], w: 92 },
  { id: 'cdn-caching', label: 'CDN', sub: 'edge', kind: 'server', at: [154, 168], w: 80 },
  { id: 'web-server-caching', label: 'Web server', sub: 'reverse proxy', kind: 'lb', at: [266, 168], w: 108 },
  { id: 'application-caching', label: 'App cache', sub: 'Memcached / Redis', kind: 'app', at: [380, 60], w: 132 },
  { id: 'database-caching', label: 'Database', sub: 'built-in cache', kind: 'db', at: [500, 168], w: 104 },
]
const APP: P = [380, 168]

export function CacheLayersVisual({ visual, node }: VisualProps) {
  const steps = visual.steps ?? []
  const focusIdx = LAYERS.findIndex((l) => l.id === node.id)
  const s = useStepper(steps.length, 3000, focusIdx >= 0 ? focusIdx + 1 : 0)
  const st = s.step
  const hit = st > 0 ? LAYERS[st - 1] : null
  // The request travels right until the layer that answers it.
  const ends: P[] = [[50, 168], [114, 168], [212, 168], [380, 86], [448, 168]]
  const path = ['M30 168L30 168', 'M50 168L114 168', 'M50 168L212 168', 'M50 168L334 168L380 168L380 86', 'M50 168L334 168L448 168']
  const seg = (a: number, b: number, on: boolean) => <Wire d={`M${a} 168L${b} 168`} state={on ? 'active' : 'idle'} />
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={240} title="Where caches sit along a request: client, CDN, web server, application cache, database">
        {seg(96, 114, st > 1)}
        {seg(194, 212, st > 2)}
        {seg(320, 334, st > 3)}
        <Wire d="M380 144L380 88" state={st === 4 ? 'active' : 'idle'} arrow="both" />
        {seg(426, 448, st === 5)}
        <Node x={APP[0]} y={APP[1]} kind="app" label="App" sub="server" w={92} h={46} />
        {LAYERS.map((l, i) => (
          <g key={l.id}>
            <Node x={l.at[0]} y={l.at[1]} kind={l.kind} label={l.label} sub={l.sub} w={l.w} h={46} state={hit?.id === l.id ? 'ok' : focusIdx === i ? 'active' : 'normal'} />
            <g transform={`translate(${l.at[0] + l.w / 2 - 6},${l.at[1] - 24})`}>
              <circle r={8} fill="var(--area-caching)" />
              <path d="M1.3 -5 L-2.6 1 H0 L-1.3 5 L2.6 -1 H0 Z" fill="#fff" />
            </g>
          </g>
        ))}
        {hit && <Badge x={hit.at[0] + (hit.id === 'application-caching' ? 0 : 0)} y={hit.id === 'application-caching' ? hit.at[1] - 34 : hit.at[1] + 38} text="cache hit: answered here" tone="ok" />}
        {st > 0 && <Packet key={`p${st}`} path={path[st - 1]} to={ends[st - 1]} label="req" dur={0.45 + 0.22 * st} />}
        <Caption x={280} y={226} tone="muted">
          a request goes right until some layer has the answer
        </Caption>
      </Diagram>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {LAYERS.map((l) => (
          <Link key={l.id} to={`/topic/${l.id}`} className={`rounded-full border px-2.5 py-0.5 text-xs ${l.id === node.id ? 'border-[var(--accent)] bg-accent-soft font-semibold' : 'border-line hover:bg-surface-2'}`}>
            {topics.nodes[l.id].title}
          </Link>
        ))}
      </div>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ query-level vs object-level */

type Gran = 'query' | 'object'
export function CacheGranularityVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<Gran>((visual.props?.mode as Gran) ?? 'query')
  const steps = visual.stepsByMode?.[mode] ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const suggestions = bulletsAfter(topics.nodes['caching-at-the-object-level'], 'Suggestions of what to cache:')
  const queryEntries = ['hash(SELECT … WHERE id=7)', 'hash(SELECT … JOIN posts …)', 'hash(SELECT … ORDER BY name)']
  const objectEntries = ['User#7 { name, posts… }', 'User#8 { name, posts… }', 'Feed#7 [ … ]']
  const entries = mode === 'query' ? queryEntries : objectEntries
  const invalid = (i: number) => (mode === 'query' ? st >= 2 && (i === 0 || i === 1 || (st >= 3 && i === 2)) : st >= 2 && i === 0)
  return (
    <ProcessPlayer
      steps={steps}
      stepper={s}
      header={
        <ModeToggle
          label="What the cache key is"
          value={mode}
          onChange={(m) => (setMode(m), s.reset())}
          options={[
            { value: 'query', label: 'Database query level' },
            { value: 'object', label: 'Object level' },
          ]}
        />
      }
      aside={
        mode === 'object' && (
          <p className="text-xs text-muted">
            <span className="font-semibold text-ink">Suggestions of what to cache: </span>
            {suggestions.map((b, i) => (
              <span key={i}>
                {b.claim.text}
                <LineRef claim={b.claim} />
                {i < suggestions.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        )
      }
    >
      <Diagram width={560} height={226} title={`Caching at the ${mode === 'query' ? 'database query' : 'object'} level: what gets invalidated when one value changes`}>
        <g transform="translate(16,30)">
          <rect width={150} height={22} fill="var(--accent-soft)" stroke="var(--border)" />
          <text x={8} y={15} fontSize={11} fontWeight={700}>
            users table
          </text>
          {[
            ['7', st >= 2 ? 'Ana → Anna' : 'Ana'],
            ['8', 'Ben'],
          ].map(([id, name], j) => (
            <g key={id}>
              <rect y={22 + j * 22} width={40} height={22} fill="var(--node-fill)" stroke="var(--border)" />
              <rect x={40} y={22 + j * 22} width={110} height={22} fill={st >= 2 && j === 0 ? 'var(--warn-soft)' : 'var(--node-fill)'} stroke="var(--border)" />
              <text x={8} y={37 + j * 22} fontSize={10}>
                {id}
              </text>
              <text x={48} y={37 + j * 22} fontSize={10}>
                {name}
              </text>
            </g>
          ))}
        </g>
        <Node x={250} y={120} kind="app" label="App" sub={mode === 'object' && st >= 1 ? 'assembles objects' : undefined} w={110} />
        <Wire d={line([166, 70], [196, 108])} state={st === 1 ? 'active' : 'idle'} />
        <Wire d={line([306, 120], [350, 120])} state={st >= 1 ? 'active' : 'idle'} />
        <g transform="translate(356,30)">
          <rect width={190} height={170} rx={10} fill="var(--node-fill)" stroke="var(--area-caching)" strokeWidth={1.5} />
          <text x={10} y={18} fontSize={11} fontWeight={700}>
            cache
          </text>
          {entries.map((e, i) => (
            <g key={e} transform={`translate(10,${30 + i * 42})`} style={{ transition: 'opacity 300ms' }} opacity={st >= 1 || i === 0 ? 1 : 0.35}>
              <rect width={170} height={34} rx={6} fill={invalid(i) ? 'var(--bad-soft)' : 'var(--surface-2)'} stroke={invalid(i) ? 'var(--bad)' : 'var(--border)'} />
              <text x={8} y={21} fontSize={9.5} style={{ fontFamily: 'ui-monospace, monospace', textDecoration: invalid(i) ? 'line-through' : undefined }}>
                {e}
              </text>
            </g>
          ))}
        </g>
        {st === 1 && <Packet key={`s${mode}`} path={line([306, 120], [350, 120])} to={[350, 120]} label="set" />}
        {mode === 'query' && st === 2 && <Caption x={450} y={214} tone="bad">every query that might include the cell</Caption>}
        {mode === 'query' && st === 3 && <Caption x={450} y={214} tone="bad">hard to tell which complex queries are affected</Caption>}
        {mode === 'object' && st === 2 && <Caption x={450} y={214} tone="ok">only the object built from that row</Caption>}
        {mode === 'object' && st === 3 && <Caption x={450} y={214} tone="ok">workers rebuild objects asynchronously</Caption>}
        <Caption x={90} y={110} tone="muted">
          sample data
        </Caption>
      </Diagram>
    </ProcessPlayer>
  )
}
