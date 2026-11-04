import { useCallback, useEffect, useRef, useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Caption, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { useStepHighlight } from '../kit/highlight.tsx'
import { LineRef } from '../kit/Claims.tsx'
import { q } from '../../../content/visuals/types.ts'

type P = [number, number]

/* ------------------------------------------------------------------ routing simulator */

type Method = 'random' | 'least' | 'session' | 'rr' | 'wrr'
/** The Primer's list of routing metrics (README lines 686–689); each option highlights its own bullet. */
const METHODS: { value: Method; label: string; quote: string; line: number }[] = [
  { value: 'random', label: 'Random', quote: 'Random', line: 686 },
  { value: 'least', label: 'Least loaded', quote: 'Least loaded', line: 687 },
  { value: 'session', label: 'Session/cookies', quote: 'Session/cookies', line: 688 },
  { value: 'rr', label: 'Round robin', quote: 'Round robin or weighted round robin', line: 689 },
  { value: 'wrr', label: 'Weighted round robin', quote: 'Round robin or weighted round robin', line: 689 },
]
const CLIENTS = ['A', 'B', 'C'] as const
const CLIENT_COLOR = ['var(--area-fundamentals)', 'var(--area-networking)', 'var(--area-async)']
const CLIENT_Y = [58, 140, 222]
const SERVER_Y = [40, 106, 172, 238]
const LB: P = [228, 140]
const SX = 440

interface Server {
  healthy: boolean
  weight: number
  active: number
  total: number
}
interface Flight {
  id: number
  client: number
  server: number
}

const initial = (): Server[] => [0, 1, 2, 3].map((i) => ({ healthy: true, weight: i === 0 ? 3 : 1, active: 0, total: 0 }))

export function LoadBalancerSim(_: VisualProps) {
  const [method, setMethod] = useState<Method>('rr')
  const [servers, setServers] = useState<Server[]>(initial)
  const [flights, setFlights] = useState<Flight[]>([])
  const [running, setRunning] = useState(false)
  const st = useRef({ rr: 0, wrr: 0, nextClient: 0, id: 0, sticky: new Map<number, number>() })
  const { setText } = useStepHighlight()
  const unhealthy = servers.some((s) => !s.healthy)

  useEffect(() => {
    setText(METHODS.find((m) => m.value === method)!.quote)
  }, [method, setText])
  useEffect(() => () => setText(null), [setText])

  const pick = useCallback(
    (client: number, list: Server[]): number | null => {
      const healthy = list.map((s, i) => (s.healthy ? i : -1)).filter((i) => i >= 0)
      if (healthy.length === 0) return null
      const s = st.current
      switch (method) {
        case 'random':
          return healthy[Math.floor(Math.random() * healthy.length)]
        case 'least':
          return healthy.reduce((best, i) => (list[i].active < list[best].active ? i : best), healthy[0])
        case 'session': {
          const prev = s.sticky.get(client)
          if (prev !== undefined && list[prev].healthy) return prev
          const chosen = healthy.reduce((best, i) => (list[i].active < list[best].active ? i : best), healthy[0])
          s.sticky.set(client, chosen)
          return chosen
        }
        case 'rr': {
          for (let k = 0; k < list.length; k++) {
            const i = (s.rr + k) % list.length
            if (list[i].healthy) {
              s.rr = i + 1
              return i
            }
          }
          return null
        }
        case 'wrr': {
          const cycle = healthy.flatMap((i) => Array(list[i].weight).fill(i) as number[])
          const i = cycle[s.wrr % cycle.length]
          s.wrr++
          return i
        }
      }
    },
    [method],
  )

  const serversRef = useRef(servers)
  serversRef.current = servers
  const send = useCallback(() => {
    const s = st.current
    const client = s.nextClient % 3
    s.nextClient++
    const target = pick(client, serversRef.current)
    if (target === null) return
    const id = ++s.id
    const bump = (d: number) => (l: Server[]) => l.map((x, i) => (i === target ? { ...x, active: Math.max(0, x.active + d), total: x.total + (d > 0 ? 1 : 0) } : x))
    serversRef.current = bump(1)(serversRef.current)
    setServers(bump(1))
    setFlights((f) => [...f.slice(-8), { id, client, server: target }])
    setTimeout(() => setServers(bump(-1)), 2600 + (id % 3) * 700)
  }, [pick])

  useEffect(() => {
    if (!running) return
    const t = setInterval(send, 800)
    return () => clearInterval(t)
  }, [running, send])

  const reset = () => {
    setRunning(false)
    setServers(initial())
    setFlights([])
    st.current = { rr: 0, wrr: 0, nextClient: 0, id: 0, sticky: new Map() }
  }
  const toggleHealth = (i: number) => setServers((l) => l.map((x, j) => (j === i ? { ...x, healthy: !x.healthy } : x)))
  const setWeight = (i: number, w: number) => setServers((l) => l.map((x, j) => (j === i ? { ...x, weight: w } : x)))
  const m = METHODS.find((x) => x.value === method)!
  const maxActive = Math.max(4, ...servers.map((s) => s.active))

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">Route by</span>
        <ModeToggle label="Routing method" value={method} onChange={(v) => setMethod(v)} options={METHODS.map((x) => ({ value: x.value, label: x.label }))} />
      </div>
      <div className="rounded-lg bg-bg/60 p-1">
        <Diagram width={560} height={280} title={`Load balancer routing requests from three clients to four servers by ${m.label}`}>
          {CLIENT_Y.map((y, c) => (
            <Wire key={c} d={line([110, y], [172, LB[1] + (c - 1) * 8])} state="idle" arrow="none" />
          ))}
          {SERVER_Y.map((y, i) => (
            <Wire key={i} d={line([284, LB[1] + (i - 1.5) * 8], [SX - 54, y])} state={servers[i].healthy ? 'idle' : 'broken'} arrow="none" />
          ))}
          {CLIENTS.map((c, i) => (
            <g key={c}>
              <Node x={60} y={CLIENT_Y[i]} kind="client" label={`Client ${c}`} w={96} h={44} />
              <circle cx={104} cy={CLIENT_Y[i] - 16} r={4} fill={CLIENT_COLOR[i]} />
            </g>
          ))}
          <Node x={LB[0]} y={LB[1]} kind="lb" label="Load balancer" sub={m.label} w={118} h={50} state="active" />
          <Caption x={LB[0]} y={LB[1] + 42} tone="muted">
            SSL terminated here
          </Caption>
          {servers.map((s, i) => (
            <g key={i}>
              <Node x={SX} y={SERVER_Y[i]} kind="server" label={`Server ${i + 1}`} sub={s.healthy ? `${s.active} active · ${s.total} total` : 'unhealthy'} w={116} h={46} state={s.healthy ? 'normal' : 'down'} />
              <rect x={SX + 64} y={SERVER_Y[i] - 20} width={8} height={40} rx={3} fill="var(--surface-2)" stroke="var(--border)" />
              <rect
                x={SX + 64}
                y={SERVER_Y[i] + 20 - (40 * s.active) / maxActive}
                width={8}
                height={(40 * s.active) / maxActive}
                rx={3}
                fill={s.active / maxActive > 0.75 ? 'var(--warn)' : 'var(--ok)'}
                style={{ transition: 'all 300ms' }}
              />
              {method === 'wrr' && s.healthy && <Badge x={SX + 30} y={SERVER_Y[i] - 22} text={`w=${s.weight}`} tone="accent" />}
            </g>
          ))}
          {flights.map((f) => (
            <Packet
              key={f.id}
              path={`M110 ${CLIENT_Y[f.client]}L${LB[0]} ${LB[1]}L${SX - 58} ${SERVER_Y[f.server]}`}
              to={[SX - 58, SERVER_Y[f.server]]}
              label={CLIENTS[f.client]}
              color={CLIENT_COLOR[f.client]}
              dur={1.1}
            />
          ))}
        </Diagram>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`rounded-lg border px-2.5 py-1.5 font-medium ${running ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--accent)] bg-[var(--accent)] text-white'}`}
        >
          {running ? 'Pause traffic' : 'Start traffic'}
        </button>
        <button onClick={send} className="rounded-lg border border-line px-2.5 py-1.5 font-medium hover:bg-surface-2">
          Send one request
        </button>
        <button onClick={reset} className="rounded-lg border border-line px-2.5 py-1.5 font-medium hover:bg-surface-2">
          Reset
        </button>
        <span className="mx-1 h-4 w-px bg-line" />
        {servers.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <button
              onClick={() => toggleHealth(i)}
              aria-pressed={!s.healthy}
              className={`rounded-lg border px-2 py-1.5 font-medium ${s.healthy ? 'border-line hover:bg-surface-2' : 'border-[var(--bad)] bg-[var(--bad-soft)] text-bad'}`}
            >
              S{i + 1} {s.healthy ? '✓' : '✕'}
            </button>
            {method === 'wrr' && (
              <select aria-label={`Weight of server ${i + 1}`} value={s.weight} onChange={(e) => setWeight(i, Number(e.target.value))} className="rounded border border-line bg-surface px-1 py-1">
                {[1, 2, 3, 4].map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            )}
          </span>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Click a server to mark it unhealthy: the load balancer stops sending it traffic (
        <span className="text-ink">“Preventing requests from going to unhealthy servers”</span>
        <LineRef claim={q('Preventing requests from going to unhealthy servers', 670)} />
        ). {method === 'session' && <>Each client sticks to one server (“Session persistence”<LineRef claim={q('Session persistence', 680)} />). </>}
        {method === 'wrr' && <>Weights are yours to set. </>}
        {unhealthy && <span className="text-bad">Unhealthy servers receive no requests.</span>}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ layer 4 vs layer 7 */

type Layer = 'L4' | 'L7'

function PacketAnatomy({ layer, step }: { layer: Layer; step: number }) {
  const headerOn = step >= 1
  const payloadOn = layer === 'L7' && step >= 2
  const payload = layer === 'L7' && step >= 4 ? 'GET /billing  cookie: …' : 'GET /video  cookie: …'
  return (
    <g transform="translate(150,14)">
      <text x={0} y={-2} fontSize={10} className="muted">
        what the load balancer reads
      </text>
      <rect x={0} y={4} width={128} height={26} rx={5} fill={headerOn ? 'var(--accent-soft)' : 'var(--surface-2)'} stroke={headerOn ? 'var(--accent)' : 'var(--border)'} />
      <text x={64} y={21} fontSize={10} textAnchor="middle" fontWeight={600}>
        src/dst IP · ports
      </text>
      <rect x={130} y={4} width={150} height={26} rx={5} fill={payloadOn ? 'var(--accent-soft)' : 'var(--surface-2)'} stroke={payloadOn ? 'var(--accent)' : 'var(--border)'} strokeDasharray={layer === 'L4' ? '4 3' : undefined} />
      <text x={205} y={21} fontSize={10} textAnchor="middle" className={payloadOn ? undefined : 'muted'}>
        {layer === 'L4' && step >= 2 ? 'contents: not inspected' : payload}
      </text>
    </g>
  )
}

function LayerDiagram({ layer, step }: { layer: Layer; step: number }) {
  const C: P = [62, 150]
  const L: P = [222, 150]
  const pools = [
    { y: 74, label: 'Video 1', kind: 'video' },
    { y: 128, label: 'Video 2', kind: 'video' },
    { y: 190, label: 'Billing 1', kind: 'billing' },
    { y: 244, label: 'Billing 2', kind: 'billing' },
  ]
  const target = layer === 'L4' ? (step >= 3 ? 2 : -1) : step === 3 ? 0 : step === 4 ? 2 : -1
  const cl = line([112, 150], [164, 150])
  const out = (i: number) => line([280, 150], [384, pools[i].y])
  return (
    <Diagram width={560} height={274} title={`Layer ${layer === 'L4' ? 4 : 7} load balancing`}>
      <PacketAnatomy layer={layer} step={step} />
      <Wire d={cl} state={step >= 1 ? 'active' : 'idle'} />
      {pools.map((_p, i) => (
        <Wire key={i} d={out(i)} state={target === i ? 'active' : 'faded'} />
      ))}
      <Node x={C[0]} y={C[1]} kind="client" label="Client" w={96} />
      <Node
        x={L[0]}
        y={L[1]}
        kind="lb"
        label={`Layer ${layer === 'L4' ? 4 : 7} LB`}
        sub={layer === 'L4' ? (step >= 3 ? 'NAT' : 'transport layer') : step >= 1 ? 'terminates traffic' : 'application layer'}
        w={116}
        state="active"
      />
      {pools.map((p) => (
        <Node key={p.label} x={440} y={p.y} kind="server" label={p.label} sub={p.kind === 'billing' ? 'security-hardened' : 'hosts videos'} w={134} h={46} state={p.kind === 'billing' ? 'warn' : 'normal'} />
      ))}
      {layer === 'L4' && step === 3 && <Caption x={330} y={268} tone="muted">picked by IP/port: content-blind</Caption>}
      {layer === 'L4' && step === 4 && <Badge x={L[0]} y={L[1] + 40} text="less time + compute" tone="ok" />}
      {layer === 'L7' && step === 1 && <Badge x={L[0]} y={L[1] + 40} text="connection ends here" tone="accent" />}
      {step >= 1 && step <= 2 && <Packet key={`in${layer}${step}`} path={cl} to={[164, 150]} label={layer === 'L4' ? 'pkt' : 'msg'} />}
      {target >= 0 && <Packet key={`out${layer}${step}`} path={out(target)} to={[384, pools[target].y]} label={layer === 'L4' ? 'pkt' : step === 4 ? '$' : '▶'} tone={pools[target].kind === 'billing' ? 'warn' : 'accent'} />}
    </Diagram>
  )
}

export function L4L7Visual({ visual }: VisualProps) {
  const [layer, setLayer] = useState<Layer>((visual.props?.mode as Layer) ?? 'L4')
  const steps = visual.stepsByMode?.[layer] ?? []
  const stepper = useStepper(steps.length)
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      header={
        <ModeToggle
          label="Layer"
          value={layer}
          onChange={(m) => (setLayer(m), stepper.reset())}
          options={[
            { value: 'L4', label: 'Layer 4 (transport)' },
            { value: 'L7', label: 'Layer 7 (application)' },
          ]}
        />
      }
    >
      <LayerDiagram layer={layer} step={stepper.step} />
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ vertical vs horizontal scaling */

export function ScalingVisual(_: VisualProps) {
  const [mode, setMode] = useState<'up' | 'out'>('out')
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <ModeToggle
        label="Scaling approach"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'up', label: 'Scale up (vertical)' },
          { value: 'out', label: 'Scale out (horizontal)' },
        ]}
      />
      <div className="rounded-lg bg-bg/60 p-1">
        <Diagram width={560} height={250} title={mode === 'up' ? 'Vertical scaling: one bigger, more expensive server' : 'Horizontal scaling: a load balancer in front of cloned commodity servers with sessions in a shared store'}>
          <Node x={60} y={125} kind="client" label="Users" w={92} />
          {mode === 'up' ? (
            <>
              <Wire d={line([106, 125], [250, 125])} state="active" />
              <Node x={340} y={125} kind="server" label="One big server" sub="more expensive hardware" w={176} h={96} state="active" />
              <Badge x={340} y={66} text="single point of failure" tone="bad" />
            </>
          ) : (
            <>
              <Wire d={line([106, 125], [170, 125])} state="active" />
              <Node x={226} y={125} kind="lb" label="Load balancer" w={108} state="active" />
              {[50, 125, 200].map((y, i) => (
                <g key={y}>
                  <Wire d={line([280, 125], [344, y])} state="active" />
                  <Node x={396} y={y} kind="server" label={`Clone ${i + 1}`} sub="commodity, stateless" w={104} h={46} />
                  <Wire d={line([448, y], [494, 125])} state="faded" arrow="none" />
                </g>
              ))}
              <Node x={516} y={125} kind="cache" label="" w={44} h={60} />
              <Caption x={516} y={170} tone="muted">
                sessions
              </Caption>
            </>
          )}
        </Diagram>
      </div>
    </div>
  )
}
