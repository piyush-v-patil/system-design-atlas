import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { bullets, bulletsAfter } from '../auto.ts'
import { Badge, Caption, curve, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { LineRef } from '../kit/Claims.tsx'

/* ------------------------------------------------------------------ ACID / BASE */

/** The four ACID (RDBMS) or three BASE (NoSQL) properties, quoted from the node's own bullets. */
export function AcidBase({ node }: VisualProps) {
  const items = bullets(topics.nodes[node.id]).filter((b) => b.depth === 0 && /^\*\*/.test(b.md))
  const isAcid = node.id.startsWith('relational')
  return (
    <div className="rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="mb-2 text-sm font-semibold">{isAcid ? 'ACID: properties of relational transactions' : 'BASE: how NoSQL databases are often described'}</div>
      <div className={`grid gap-2 ${items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {items.map((b, i) => {
          const [term, ...rest] = b.claim.text.split(' - ')
          return (
            <div key={i} className="rounded-lg border border-line p-3" style={{ animation: `fade-up 300ms ease-out ${i * 80}ms both` }}>
              <div className="text-2xl font-black text-[var(--accent)]">{term[0]}</div>
              <div className="text-sm font-semibold">{term}</div>
              <div className="mt-1 text-xs leading-snug text-muted">
                {rest.join(' - ')}
                <LineRef claim={b.claim} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ NoSQL data models */

type Model = 'kv' | 'document' | 'wide' | 'graph'

function KvModel() {
  const rows = [
    ['user:42', '{"name": "Ana"}'],
    ['session:9f', 'cart=3 items'],
    ['score:alice', '980'],
    ['score:bob', '1210'],
  ]
  return (
    <Diagram width={560} height={200} title="Key-value store: keys hashed to buckets holding values">
      <text x={20} y={22} fontSize={11} fontWeight={700}>
        get(key) → value
      </text>
      {rows.map(([k, v], i) => (
        <g key={k} transform={`translate(20,${40 + i * 38})`} style={{ animation: `fade-up 300ms ease-out ${i * 90}ms both` }}>
          <rect width={150} height={28} rx={6} fill="var(--accent-soft)" stroke="var(--accent)" />
          <text x={10} y={18} fontSize={11} fontWeight={600} style={{ fontFamily: 'ui-monospace, monospace' }}>
            {k}
          </text>
          <path d="M156 14h52" stroke="var(--wire)" strokeWidth={1.5} markerEnd="" />
          <path d="M202 9l8 5-8 5" fill="var(--wire)" />
          <rect x={214} width={200} height={28} rx={6} fill="var(--node-fill)" stroke="var(--node-stroke)" />
          <text x={224} y={18} fontSize={11} style={{ fontFamily: 'ui-monospace, monospace' }}>
            {v}
          </text>
        </g>
      ))}
      <text x={440} y={70} fontSize={10.5} className="muted">
        keys can be kept
      </text>
      <text x={440} y={84} fontSize={10.5} className="muted">
        in lexicographic order
      </text>
      <text x={440} y={98} fontSize={10.5} className="muted">
        → range scans
      </text>
      <path d="M432 52v110" stroke="var(--accent)" strokeDasharray="3 3" />
    </Diagram>
  )
}

function DocumentModel() {
  const docs = [
    ['{', '  "_id": 1,', '  "name": "Ana",', '  "tags": ["admin"]', '}'],
    ['{', '  "_id": 2,', '  "name": "Ben",', '  "address": {', '    "city": "Oslo" }', '}'],
    ['{', '  "_id": 3,', '  "title": "Order 77",', '  "total": 42.5', '}'],
  ]
  return (
    <Diagram width={560} height={220} title="Document store: a collection of JSON documents whose fields can differ">
      <rect x={10} y={14} width={540} height={196} rx={12} fill="none" stroke="var(--border)" strokeDasharray="5 4" />
      <text x={22} y={32} fontSize={11} fontWeight={700}>
        collection: users_and_orders
      </text>
      {docs.map((d, i) => (
        <g key={i} transform={`translate(${22 + i * 178},44)`} style={{ animation: `fade-up 300ms ease-out ${i * 100}ms both` }}>
          <rect width={164} height={150} rx={8} fill="var(--node-fill)" stroke="var(--node-stroke)" />
          {d.map((l, j) => (
            <text key={j} x={10} y={20 + j * 16} fontSize={10.5} style={{ fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre' }}>
              {l}
            </text>
          ))}
        </g>
      ))}
      <Caption x={280} y={206} tone="muted">
        fields differ per document; query on the structure inside them
      </Caption>
    </Diagram>
  )
}

/** Mirrors the Primer's own wide-column image (companies / address / website). */
function WideModel() {
  const cell = (x: number, y: number, w: number, t: string, fill: string, bold = false) => (
    <g>
      <rect x={x} y={y} width={w} height={26} fill={fill} stroke="var(--border)" />
      <text x={x + 8} y={y + 17} fontSize={11} fontWeight={bold ? 700 : 400}>
        {t}
      </text>
    </g>
  )
  return (
    <Diagram width={560} height={232} title="Wide column store: row key, column families of name/value columns">
      {cell(20, 20, 520, 'companies', 'var(--accent-soft)', true)}
      <rect x={20} y={46} width={90} height={104} fill="var(--surface-2)" stroke="var(--border)" />
      <text x={65} y={104} fontSize={22} fontWeight={700} textAnchor="middle">
        1
      </text>
      {cell(110, 46, 215, 'address', 'var(--ok-soft)', true)}
      {cell(325, 46, 215, 'website', 'var(--ok-soft)', true)}
      {[
        ['city', 'San Francisco', 'subdomain', 'www'],
        ['state', 'California', 'domain', 'grio.com'],
        ['street', 'Kearny St.', 'protocol', 'http'],
      ].map((r, i) => (
        <g key={i}>
          {cell(110, 72 + i * 26, 70, r[0], 'var(--warn-soft)')}
          {cell(180, 72 + i * 26, 145, r[1], 'var(--node-fill)')}
          {cell(325, 72 + i * 26, 80, r[2], 'var(--warn-soft)')}
          {cell(405, 72 + i * 26, 135, r[3], 'var(--node-fill)')}
        </g>
      ))}
      <Caption x={65} y={170} tone="muted">
        row key
      </Caption>
      <Caption x={218} y={170} tone="muted">
        column family
      </Caption>
      <Caption x={440} y={170} tone="muted">
        column: name/value + timestamp
      </Caption>
      <text x={280} y={204} fontSize={11} textAnchor="middle" style={{ fontFamily: 'ui-monospace, monospace' }}>
        ColumnFamily&lt;RowKey, Columns&lt;ColKey, Value, Timestamp&gt;&gt;
      </text>
      <Caption x={280} y={224} tone="muted">
        example data (source: SQL &amp; NoSQL, a brief history)
      </Caption>
    </Diagram>
  )
}

/** Mirrors the Primer's own graph image (Alice, Bob, the Chess group). */
function GraphModel() {
  const N = { alice: [110, 150] as [number, number], bob: [440, 60] as [number, number], chess: [400, 200] as [number, number] }
  return (
    <Diagram width={560} height={250} title="Graph database: records are nodes, relationships are edges">
      <Wire d={curve([150, 136], [400, 70], -20)} state="active" label="knows" labelAt={[270, 82]} />
      <Wire d={curve([400, 82], [152, 148], -20)} state="idle" label="knows" labelAt={[290, 128]} />
      <Wire d={curve([150, 168], [356, 204], 18)} state="active" label="is_member" labelAt={[240, 210]} />
      <Wire d={curve([430, 92], [420, 168], 20)} state="active" label="is_member" labelAt={[468, 132]} />
      {(
        [
          ['alice', 'Alice', 'Age: 18'],
          ['bob', 'Bob', 'Age: 22'],
          ['chess', 'Chess', 'Type: Group'],
        ] as const
      ).map(([k, name, sub]) => (
        <g key={k} transform={`translate(${N[k][0]},${N[k][1]})`}>
          <circle r={40} fill={k === 'chess' ? 'var(--warn-soft)' : 'var(--accent-soft)'} stroke={k === 'chess' ? 'var(--warn)' : 'var(--accent)'} strokeWidth={1.6} />
          <text y={-2} fontSize={12} fontWeight={700} textAnchor="middle">
            {name}
          </text>
          <text y={13} fontSize={10} textAnchor="middle" className="muted">
            {sub}
          </text>
        </g>
      ))}
      <Caption x={280} y={244} tone="muted">
        example data (source: Wikipedia, Graph database)
      </Caption>
    </Diagram>
  )
}

export function DataModelVisual({ visual }: VisualProps) {
  const m = (visual.props?.model as Model) ?? 'kv'
  return (
    <div className="rounded-xl border border-line bg-surface p-2 sm:p-3">
      <div className="rounded-lg bg-bg/60 p-1">{m === 'kv' ? <KvModel /> : m === 'document' ? <DocumentModel /> : m === 'wide' ? <WideModel /> : <GraphModel />}</div>
      {(m === 'kv' || m === 'document') && <p className="mt-1 px-1 text-[0.6875rem] text-muted">Sample keys and documents are illustrative.</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ SQL or NoSQL picker */

/** Tick the Primer's own reasons that apply to you; see which side they fall on. */
export function SqlNoSqlPicker({ node }: VisualProps) {
  const n = topics.nodes[node.id]
  const sql = bulletsAfter(n, 'Reasons for **SQL**')
  const nosql = bulletsAfter(n, 'Reasons for **NoSQL**')
  const samples = bulletsAfter(n, 'Sample data well-suited for NoSQL')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const toggle = (k: string) => setPicked((s) => (s.has(k) ? (s.delete(k), new Set(s)) : new Set(s).add(k)))
  const count = (side: 'sql' | 'nosql') => [...picked].filter((k) => k.startsWith(side)).length
  const a = count('sql')
  const b = count('nosql')
  const col = (side: 'sql' | 'nosql', title: string, items: typeof sql) => (
    <fieldset className="min-w-0 rounded-lg border border-line p-3">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <ul className="flex flex-col gap-1">
        {items.map((it, i) => {
          const k = `${side}${i}`
          return (
            <li key={k}>
              <label className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm transition-colors ${picked.has(k) ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}>
                <input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={picked.has(k)} onChange={() => toggle(k)} />
                <span>
                  {it.claim.text}
                  <LineRef claim={it.claim} />
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
  const lean = a === b ? (a === 0 ? 'Tick what your system needs.' : 'Even: look at the specifics, or use both.') : a > b ? 'Your needs lean towards SQL.' : 'Your needs lean towards NoSQL.'
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {col('sql', 'Reasons for SQL', sql)}
        {col('nosql', 'Reasons for NoSQL', nosql)}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 px-3 py-2 text-sm" aria-live="polite">
        <div className="flex h-2.5 w-40 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-[var(--area-data)] transition-all duration-300" style={{ width: a + b ? `${(100 * a) / (a + b)}%` : '50%' }} />
          <div className="h-full bg-[var(--area-caching)] transition-all duration-300" style={{ width: a + b ? `${(100 * b) / (a + b)}%` : '50%' }} />
        </div>
        <span>
          SQL {a} · NoSQL {b}: <strong>{lean}</strong>
        </span>
      </div>
      <div className="text-xs text-muted">
        <span className="font-semibold text-ink">Sample data well-suited for NoSQL: </span>
        {samples.map((sm, i) => (
          <span key={i}>
            {sm.claim.text}
            <LineRef claim={sm.claim} />
            {i < samples.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </div>
      <p className="text-[0.6875rem] text-muted">A tally of the reasons, not a rule: weigh what matters most for your system.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ denormalization */

export function DenormalizationVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const denorm = st >= 2
  const table = (x: number, y: number, name: string, cols: string[], rows: string[][], hi?: number) => (
    <g transform={`translate(${x},${y})`}>
      <rect width={cols.length * 78} height={22} fill="var(--accent-soft)" stroke="var(--border)" />
      <text x={8} y={15} fontSize={11} fontWeight={700}>
        {name}
      </text>
      {cols.map((c, i) => (
        <g key={c}>
          <rect x={i * 78} y={22} width={78} height={20} fill={hi === i ? 'var(--warn-soft)' : 'var(--surface-2)'} stroke="var(--border)" />
          <text x={i * 78 + 6} y={36} fontSize={10} fontWeight={600}>
            {c}
          </text>
          {rows.map((r, j) => (
            <g key={j}>
              <rect x={i * 78} y={42 + j * 20} width={78} height={20} fill={hi === i ? 'var(--warn-soft)' : 'var(--node-fill)'} stroke="var(--border)" />
              <text x={i * 78 + 6} y={56 + j * 20} fontSize={10}>
                {r[i]}
              </text>
            </g>
          ))}
        </g>
      ))}
    </g>
  )
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={236} title="Denormalization: copying data into the table that is read, to avoid a join">
        {table(16, 20, 'users', ['id', 'name'], [['7', 'Ana'], ['8', 'Ben']])}
        {table(16, 130, 'posts', denorm ? ['id', 'user_id', 'author'] : ['id', 'user_id', 'title'], denorm ? [['1', '7', 'Ana'], ['2', '8', 'Ben']] : [['1', '7', 'Hello'], ['2', '8', 'Scaling']], denorm ? 2 : undefined)}
        <Node x={470} y={110} kind="app" label="Read a feed" sub={denorm ? 'one table' : 'needs a join'} w={140} state={st === 1 ? 'warn' : denorm ? 'ok' : 'normal'} />
        {!denorm && <Wire d={curve([176, 60], [176, 172], 40)} state={st === 1 ? 'bad' : 'idle'} arrow="both" label="JOIN" labelAt={[226, 120]} />}
        <Wire d={line([400, 110], [258, 170])} state={st >= 1 ? 'active' : 'idle'} />
        {st === 1 && <Badge x={226} y={146} text="expensive join: disk" tone="bad" />}
        {st === 3 && (
          <>
            <Wire d={line([400, 96], [176, 60])} state="active" />
            <Badge x={300} y={60} text="rename Ana → write both tables" tone="warn" />
          </>
        )}
        {st === 4 && <Badge x={470} y={170} text="reads ≫ writes (100:1 or 1000:1)" tone="ok" />}
        {st === 5 && <Badge x={470} y={170} text="materialized view keeps copies in sync" tone="accent" />}
        {st >= 1 && st !== 3 && <Packet key={`r${st}`} path={line([400, 110], [258, 170])} to={[258, 170]} label="read" tone={denorm ? 'ok' : 'warn'} />}
        <Caption x={540} y={230} anchor="end" tone="muted">
          sample tables are illustrative
        </Caption>
      </Diagram>
    </ProcessPlayer>
  )
}
