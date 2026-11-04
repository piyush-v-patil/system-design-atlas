import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { Badge, Caption, Diagram, line, Node, Packet, Wire, type WireState } from '../kit/svg.tsx'
import { ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { CodeSteps, codeBlock } from '../kit/CodeSteps.tsx'

type Strategy = 'cache-aside' | 'write-through' | 'write-behind' | 'refresh-ahead'
type P = [number, number]

// Geometry: App on the left, Cache top-right, DB bottom-right, caller off the left edge.
const APP: P = [118, 132]
const CACHE: P = [410, 62]
const DB: P = [410, 204]
const AC: [P, P] = [[172, 120], [348, 72]]
const AD: [P, P] = [[172, 146], [348, 196]]
const CD: [P, P] = [[410, 90], [410, 172]]
const CALLER: [P, P] = [[62, 132], [14, 132]]
const rev = ([a, b]: [P, P]): [P, P] => [b, a]
const mid = ([a, b]: [P, P], dx = 0, dy = 0): P => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy]

interface Scene {
  wires?: Partial<Record<'ac' | 'ad' | 'cd' | 'caller', WireState>>
  packets?: { seg: [P, P]; label?: string; tone?: 'accent' | 'ok' | 'bad' | 'warn'; delay?: number }[]
  cacheBadge?: { text: string; tone: 'ok' | 'bad' | 'warn' | 'accent' }
  dbBadge?: { text: string; tone: 'ok' | 'bad' | 'warn' | 'accent' }
  cacheState?: 'normal' | 'active' | 'down' | 'ok' | 'warn'
  ttl?: number
  extra?: ReactNode
}

function scene(strategy: Strategy, s: number): Scene {
  switch (strategy) {
    case 'cache-aside':
      return ([
        { cacheBadge: { text: 'empty', tone: 'accent' } },
        { wires: { ac: 'active' }, packets: [{ seg: AC, label: 'get' }, { seg: rev(AC), label: 'miss', tone: 'bad', delay: 1 }], cacheBadge: { text: 'miss', tone: 'bad' } },
        { wires: { ad: 'active' }, packets: [{ seg: AD, label: 'SQL' }, { seg: rev(AD), label: 'row', tone: 'ok', delay: 1 }], cacheBadge: { text: 'empty', tone: 'accent' } },
        { wires: { ac: 'active' }, packets: [{ seg: AC, label: 'set' }], cacheBadge: { text: 'user.42 ✓', tone: 'ok' }, cacheState: 'ok' },
        { wires: { caller: 'active' }, packets: [{ seg: CALLER, label: 'user', tone: 'ok' }], cacheBadge: { text: 'user.42 ✓', tone: 'ok' } },
        { wires: { ac: 'ok' }, packets: [{ seg: AC, label: 'get' }, { seg: rev(AC), label: 'hit', tone: 'ok', delay: 1 }], cacheBadge: { text: 'hit', tone: 'ok' }, cacheState: 'ok' },
      ] as Scene[])[s]
    case 'write-through':
      return ([
        { cacheBadge: { text: 'empty', tone: 'accent' } },
        { wires: { ac: 'active' }, packets: [{ seg: AC, label: 'set' }], cacheBadge: { text: 'writing…', tone: 'warn' }, cacheState: 'active' },
        { wires: { cd: 'active' }, packets: [{ seg: CD, label: 'UPD' }, { seg: rev(CD), label: 'ok', tone: 'ok', delay: 1 }], cacheBadge: { text: 'waiting for DB', tone: 'warn' }, dbBadge: { text: 'user ✓', tone: 'ok' }, cacheState: 'active' },
        { wires: { ac: 'ok' }, packets: [{ seg: rev(AC), label: 'ok', tone: 'ok' }], cacheBadge: { text: 'user ✓', tone: 'ok' }, dbBadge: { text: 'user ✓', tone: 'ok' }, cacheState: 'ok' },
        { wires: { ac: 'ok' }, packets: [{ seg: AC, label: 'get' }, { seg: rev(AC), label: 'hit', tone: 'ok', delay: 1 }], cacheBadge: { text: 'hit', tone: 'ok' }, dbBadge: { text: 'user ✓', tone: 'ok' }, cacheState: 'ok' },
      ] as Scene[])[s]
    case 'write-behind':
      return ([
        { cacheBadge: { text: '0 pending', tone: 'accent' } },
        { wires: { ac: 'active' }, packets: [{ seg: AC, label: 'A' }, { seg: rev(AC), label: 'ok', tone: 'ok', delay: 1 }], cacheBadge: { text: 'A · 1 pending', tone: 'warn' }, cacheState: 'warn' },
        { wires: { cd: 'active' }, packets: [{ seg: CD, label: 'A', tone: 'accent' }], cacheBadge: { text: '0 pending', tone: 'ok' }, dbBadge: { text: 'A ✓', tone: 'ok' }, cacheState: 'ok' },
        { wires: { ac: 'active' }, packets: [{ seg: AC, label: 'B' }, { seg: rev(AC), label: 'ok', tone: 'ok', delay: 1 }], cacheBadge: { text: 'B · 1 pending', tone: 'warn' }, dbBadge: { text: 'A ✓', tone: 'ok' }, cacheState: 'warn' },
        { wires: { cd: 'broken' }, cacheBadge: { text: 'down', tone: 'bad' }, dbBadge: { text: 'A ✓  B lost', tone: 'bad' }, cacheState: 'down' },
      ] as Scene[])[s]
    case 'refresh-ahead':
      return ([
        { cacheBadge: { text: 'item A', tone: 'ok' }, ttl: 0.9 },
        { wires: { ac: 'ok' }, packets: [{ seg: AC, label: 'get' }, { seg: rev(AC), label: 'hit', tone: 'ok', delay: 1 }], cacheBadge: { text: 'item A · hit', tone: 'ok' }, ttl: 0.3 },
        { wires: { cd: 'active' }, packets: [{ seg: CD, label: 'A?' }, { seg: rev(CD), label: 'A', tone: 'ok', delay: 1 }], cacheBadge: { text: 'refreshed', tone: 'accent' }, ttl: 1, cacheState: 'active' },
        { wires: { ac: 'ok' }, packets: [{ seg: AC, label: 'get' }, { seg: rev(AC), label: 'hit', tone: 'ok', delay: 1 }], cacheBadge: { text: 'item A · hit', tone: 'ok' }, ttl: 0.85, cacheState: 'ok' },
        { wires: { cd: 'active' }, packets: [{ seg: CD, label: 'B?' }, { seg: rev(CD), label: 'B', tone: 'warn', delay: 1 }], cacheBadge: { text: 'B refreshed, never read', tone: 'warn' }, ttl: 0.75, cacheState: 'warn' },
      ] as Scene[])[s]
  }
}

/** Which code lines (1-based, within each block) light up per step. */
const CODE_LINES: Record<Strategy, { block: number; lines: number[] }[][]> = {
  'cache-aside': [[], [{ block: 0, lines: [2, 3] }], [{ block: 0, lines: [4] }], [{ block: 0, lines: [5, 6, 7] }], [{ block: 0, lines: [8] }], [{ block: 0, lines: [2] }]],
  'write-through': [[], [{ block: 0, lines: [1] }, { block: 1, lines: [1] }], [{ block: 1, lines: [2] }], [{ block: 1, lines: [3] }], []],
  'write-behind': [],
  'refresh-ahead': [],
}

function CacheDiagram({ strategy, step, title }: { strategy: Strategy; step: number; title: string }) {
  const sc = scene(strategy, step) ?? {}
  const w = sc.wires ?? {}
  const cdIdle: WireState = strategy === 'cache-aside' ? 'faded' : 'idle'
  const adIdle: WireState = strategy === 'cache-aside' ? 'idle' : 'faded'
  return (
    <Diagram width={560} height={262} title={title}>
      <Wire d={line(...AC)} state={w.ac ?? 'idle'} arrow="none" />
      <Wire d={line(...AD)} state={w.ad ?? adIdle} arrow="none" dashed={strategy !== 'cache-aside'} />
      <Wire d={line(...CD)} state={w.cd ?? cdIdle} arrow="none" dashed={strategy === 'cache-aside'} />
      <Wire d={line(...CALLER)} state={w.caller ?? 'faded'} arrow="end" />
      {strategy === 'cache-aside' && <Caption x={mid(CD)[0] + 10} y={mid(CD)[1] + 4} anchor="start" tone="muted">no direct link</Caption>}
      {strategy !== 'cache-aside' && <Caption x={mid(AD)[0] - 6} y={mid(AD)[1] + 22} anchor="middle" tone="muted">app never queries the DB</Caption>}
      <Caption x={14} y={120} anchor="start" tone="muted">caller</Caption>

      <Node x={APP[0]} y={APP[1]} kind="app" label="Application" sub="your code" w={112} />
      <Node x={CACHE[0]} y={CACHE[1]} kind="cache" label="Cache" sub="in-memory" w={124} state={sc.cacheState ?? 'normal'} />
      <Node x={DB[0]} y={DB[1]} kind="db" label="Database" sub="source of truth" w={124} h={58} />
      {sc.cacheBadge && <Badge x={CACHE[0]} y={CACHE[1] - 34} {...sc.cacheBadge} />}
      {sc.dbBadge && <Badge x={DB[0]} y={DB[1] + 44} {...sc.dbBadge} />}
      {sc.ttl !== undefined && (
        <g transform={`translate(${CACHE[0] + 74},${CACHE[1] - 22})`}>
          <text x={0} y={-4} fontSize={9} className="muted">TTL</text>
          <rect width={14} height={48} rx={3} fill="var(--surface-2)" stroke="var(--node-stroke)" />
          <rect y={48 * (1 - sc.ttl)} width={14} height={48 * sc.ttl} rx={3} fill={sc.ttl < 0.4 ? 'var(--warn)' : 'var(--ok)'} style={{ transition: 'all 400ms' }} />
        </g>
      )}
      {sc.packets?.map((pk, i) => (
        <Packet key={`${step}-${i}`} path={line(...pk.seg)} to={pk.seg[1]} label={pk.label} tone={pk.tone} delay={pk.delay} />
      ))}
    </Diagram>
  )
}

/** Write-behind follows the Primer's diagram (rgSrvjG): 1 write to cache, 2 add event to queue, 3 return, 4 event processor writes the DB. */
function WriteBehindDiagram({ step }: { step: number }) {
  const A: P = [100, 132]
  const C: P = [290, 60]
  const Q: P = [474, 60]
  const E: P = [474, 168]
  const D: P = [290, 212]
  const ac: [P, P] = [[150, 120], [232, 74]]
  const cq: [P, P] = [[350, 60], [420, 60]]
  const qe: [P, P] = [[474, 84], [474, 144]]
  const ed: [P, P] = [[418, 182], [354, 204]]
  const down = step >= 5
  return (
    <Diagram width={560} height={262} title="Write-behind: write to cache, add an event to a queue, return, and an event processor writes the database asynchronously">
      <Wire d={line(...ac)} state={step === 1 || step === 3 || step === 5 ? 'active' : 'idle'} arrow="none" />
      <Wire d={line(...cq)} state={step === 2 ? 'active' : down ? 'faded' : 'idle'} />
      <Wire d={line(...qe)} state={step === 4 ? 'active' : 'idle'} arrow="both" />
      <Wire d={line(...ed)} state={step === 4 ? 'active' : 'idle'} />
      <Wire d={line([48, 132], [10, 132])} state="faded" />
      <Caption x={14} y={120} anchor="start" tone="muted">caller</Caption>
      <Caption x={385} y={50} tone="muted">2. add event</Caption>
      <Caption x={484} y={118} anchor="start" tone="muted">4. async</Caption>
      <Node x={A[0]} y={A[1]} kind="app" label="Application" w={104} />
      <Node x={C[0]} y={C[1]} kind="cache" label="Cache" sub="in-memory" w={118} state={down ? 'down' : step >= 1 ? 'ok' : 'normal'} />
      <Node x={Q[0]} y={Q[1]} kind="queue" label="Queue" w={104} state={step === 2 || step === 3 ? 'warn' : 'normal'} />
      <Node x={E[0]} y={E[1]} kind="server" label="Event" sub="processor" w={104} state={step === 4 ? 'active' : 'normal'} />
      <Node x={D[0]} y={D[1]} kind="db" label="Database" w={118} h={56} />
      {step >= 1 && <Badge x={C[0]} y={C[1] - 34} text={down ? 'down: B lost' : 'A'} tone={down ? 'bad' : 'ok'} />}
      {(step === 2 || step === 3) && <Badge x={Q[0]} y={Q[1] - 34} text="1 event: A" tone="warn" />}
      {step >= 4 && <Badge x={D[0]} y={D[1] + 42} text={down ? 'A ✓ · B never stored' : 'A ✓'} tone={down ? 'bad' : 'ok'} />}
      {step === 1 && <Packet key="w1" path={line(...ac)} to={ac[1]} label="A" />}
      {step === 2 && <Packet key="w2" path={line(...cq)} to={cq[1]} label="A" tone="warn" />}
      {step === 3 && <Packet key="w3" path={line(ac[1], ac[0])} to={ac[0]} label="ok" tone="ok" />}
      {step === 4 && (
        <>
          <Packet key="w4" path={line(...qe)} to={qe[1]} label="A" tone="warn" />
          <Packet key="w5" path={line(...ed)} to={ed[1]} label="A" delay={1} />
        </>
      )}
      {step === 5 && <Packet key="w6" path={line(...ac)} to={ac[1]} label="B" />}
    </Diagram>
  )
}

export function CacheStrategyVisual({ visual, node }: VisualProps) {
  const strategy = (visual.props?.strategy as Strategy) ?? 'cache-aside'
  const steps = visual.steps ?? []
  const stepper = useStepper(steps.length)
  const md = topics.nodes[node.id].markdown
  const codeLines = CODE_LINES[strategy][stepper.step] ?? []
  const blocks = strategy === 'cache-aside' ? [codeBlock(md, 0)] : strategy === 'write-through' ? [codeBlock(md, 0), codeBlock(md, 1)] : []
  const blockTitles = strategy === 'write-through' ? ['Application code', 'Cache code'] : ['From the Primer']
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      aside={
        blocks.length > 0 && (
          <div className={`grid gap-2 ${blocks.length > 1 ? 'sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' : ''}`}>
            {blocks.map((b, i) => (
              <CodeSteps key={i} code={b} title={blockTitles[i]} active={codeLines.filter((c) => c.block === i).flatMap((c) => c.lines)} />
            ))}
          </div>
        )
      }
    >
      {strategy === 'write-behind' ? (
        <WriteBehindDiagram step={stepper.step} />
      ) : (
        <CacheDiagram strategy={strategy} step={stepper.step} title={`${node.title}: animated flow between application, cache and database`} />
      )}
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ small multiples: who talks to whom */

const MINI: { key: Strategy; title: string; topicId: string; edges: { d: string; dashed?: boolean; label: string; lx: number; ly: number }[] }[] = [
  {
    key: 'cache-aside',
    title: 'Cache-aside',
    topicId: 'cache-aside',
    edges: [
      { d: 'M68 64L122 38', label: 'get / set', lx: 84, ly: 40 },
      { d: 'M68 86L122 112', label: 'read on miss, writes', lx: 70, ly: 124 },
    ],
  },
  {
    key: 'write-through',
    title: 'Write-through',
    topicId: 'write-through',
    edges: [
      { d: 'M68 64L122 38', label: 'read + write', lx: 84, ly: 40 },
      { d: 'M150 52L150 98', label: 'sync write', lx: 158, ly: 79 },
    ],
  },
  {
    key: 'write-behind',
    title: 'Write-behind',
    topicId: 'write-behind-write-back',
    edges: [
      { d: 'M68 64L122 38', label: 'read + write', lx: 84, ly: 40 },
      { d: 'M150 52L150 98', dashed: true, label: 'async, via queue', lx: 158, ly: 79 },
    ],
  },
  {
    key: 'refresh-ahead',
    title: 'Refresh-ahead',
    topicId: 'refresh-ahead',
    edges: [
      { d: 'M68 64L122 38', label: 'reads', lx: 92, ly: 40 },
      { d: 'M150 98L150 52', dashed: true, label: 'refresh before TTL', lx: 158, ly: 79 },
    ],
  },
]

function MiniBox({ x, y, label, kind }: { x: number; y: number; label: string; kind: 'app' | 'cache' | 'db' }) {
  const color = kind === 'cache' ? 'var(--area-caching)' : kind === 'db' ? 'var(--area-data)' : 'var(--area-fundamentals)'
  return (
    <g>
      {kind === 'db' ? (
        <path d={`M${x - 28} ${y - 10}a28 5 0 0 1 56 0v20a28 5 0 0 1-56 0zM${x - 28} ${y - 10}a28 5 0 0 0 56 0`} fill="var(--node-fill)" stroke={color} strokeWidth={1.6} />
      ) : (
        <rect x={x - 28} y={y - 14} width={56} height={28} rx={6} fill="var(--node-fill)" stroke={color} strokeWidth={1.6} />
      )}
      <text x={x} y={y + 4} fontSize={10} fontWeight={600} textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

/** Four small diagrams of the data paths, one per strategy; each opens its own animated card. */
export function CachePathsVisual(_: VisualProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MINI.map((m) => (
        <Link key={m.key} to={`/topic/${m.topicId}`} className="group rounded-xl border border-line bg-surface p-2 hover:border-[var(--accent)]">
          <div className="mb-1 text-xs font-semibold group-hover:text-link">{m.title} →</div>
          <Diagram width={200} height={140} title={`${m.title}: data paths between application, cache and database`}>
            {m.edges.map((e, i) => (
              <Wire key={i} d={e.d} state="active" arrow="both" dashed={e.dashed} label={e.label} labelAt={[e.lx, e.ly]} />
            ))}
            <MiniBox x={40} y={75} label="App" kind="app" />
            <MiniBox x={150} y={36} label="Cache" kind="cache" />
            <MiniBox x={150} y={114} label="DB" kind="db" />
          </Diagram>
        </Link>
      ))}
    </div>
  )
}
