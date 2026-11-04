import { useEffect, useRef, useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { LineRef } from '../kit/Claims.tsx'
import { q } from '../../../content/visuals/types.ts'

type P = [number, number]

/** The Primer's asynchronism diagram: request → web server → message queue → queue consumer → database. */
export function AsyncFlowVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const R: P = [56, 110]
  const W: P = [190, 110]
  const MQ: P = [340, 50]
  const QC: P = [490, 50]
  const DB: P = [400, 186]
  const rw: [P, P] = [[100, 110], [140, 110]]
  const wq: [P, P] = [[240, 96], [286, 62]]
  const qc: [P, P] = [[394, 50], [436, 50]]
  const cd: [P, P] = [[478, 74], [438, 160]]
  const wd: [P, P] = [[240, 126], [340, 178]]
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={240} title="Asynchronous workflow: the web server hands slow work to a message queue; a queue consumer does it later">
        <Wire d={line(...rw)} state={st === 1 || st === 2 ? 'active' : 'idle'} arrow="both" />
        <Wire d={line(...wq)} state={st === 2 ? 'active' : 'idle'} />
        <Wire d={line(...qc)} state={st === 3 ? 'active' : 'idle'} />
        <Wire d={line(...cd)} state={st === 3 || st === 4 ? 'active' : 'idle'} />
        <Wire d={line(...wd)} state="faded" />
        <Node x={R[0]} y={R[1]} kind="client" label="Request" w={88} />
        <Node x={W[0]} y={W[1]} kind="server" label="Web server" w={100} state={st === 1 ? 'warn' : 'normal'} />
        <Node x={MQ[0]} y={MQ[1]} kind="queue" label="Message queue" w={112} state={st === 2 ? 'warn' : 'normal'} />
        <Node x={QC[0]} y={QC[1]} kind="server" label="Queue consumer" w={118} state={st >= 3 ? 'active' : 'normal'} />
        <Node x={DB[0]} y={DB[1]} kind="db" label="Database" w={120} h={54} />
        {st === 1 && <Badge x={W[0]} y={W[1] + 40} text="expensive operation" tone="warn" />}
        {st === 2 && <Badge x={MQ[0]} y={MQ[1] + 36} text="job queued" tone="warn" />}
        {st === 4 && <Badge x={QC[0]} y={QC[1] + 36} text="periodic aggregation" tone="accent" />}
        {st === 1 && <Packet key="a1" path={line(...rw)} to={rw[1]} label="req" />}
        {st === 2 && (
          <>
            <Packet key="a2" path={line(...wq)} to={wq[1]} label="job" tone="warn" />
            <Packet key="a3" path={line(rw[1], rw[0])} to={rw[0]} label="ok" tone="ok" delay={0.6} />
          </>
        )}
        {st === 3 && (
          <>
            <Packet key="a4" path={line(...qc)} to={qc[1]} label="job" tone="warn" />
            <Packet key="a5" path={line(...cd)} to={cd[1]} label="W" delay={1} />
          </>
        )}
        {st === 4 && <Packet key="a6" path={line(...cd)} to={cd[1]} label="Σ" />}
        {/* Time the user waits (illustrative) */}
        <g transform="translate(20,214)">
          <text fontSize={10} className="muted" y={-4}>
            user waits (illustrative)
          </text>
          <rect width={240} height={8} rx={4} fill="var(--surface-2)" />
          <rect width={st >= 2 ? 40 : st === 1 ? 240 : 0} height={8} rx={4} fill={st >= 2 ? 'var(--ok)' : 'var(--warn)'} style={{ transition: 'width 500ms ease' }} />
          <text x={250} y={8} fontSize={10} style={{ fill: st >= 2 ? 'var(--ok)' : 'var(--warn)' }}>
            {st === 0 ? '' : st === 1 ? 'in-line: the whole operation' : 'queued: just the hand-off'}
          </text>
        </g>
      </Diagram>
    </ProcessPlayer>
  )
}

/** Message queue workflow with the Primer's tweet example. */
export function MessageQueueVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const U: P = [62, 120]
  const A: P = [184, 120]
  const Q: P = [292, 120]
  const WK: P = [400, 120]
  const FY = [48, 120, 192]
  const ua: [P, P] = [[118, 120], [134, 120]]
  const aq: [P, P] = [[234, 120], [246, 120]]
  const qw: [P, P] = [[338, 120], [350, 120]]
  const wf = (y: number): [P, P] => [[450, 120], [478, y]]
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={240} title="Message queue: publish a job, keep the user unblocked, a worker processes it and signals completion">
        <Wire d={line(...ua)} state={st === 1 ? 'active' : 'idle'} arrow="both" />
        <Wire d={line(...aq)} state={st === 1 ? 'active' : 'idle'} />
        <Wire d={line(...qw)} state={st === 3 ? 'active' : 'idle'} />
        {FY.map((y) => (
          <Wire key={y} d={line(...wf(y))} state={st === 4 ? 'active' : 'faded'} />
        ))}
        <Node x={U[0]} y={U[1]} kind="client" label="User" sub={st >= 2 ? 'sees own tweet' : 'posts a tweet'} w={112} state={st >= 2 ? 'ok' : 'normal'} />
        <Node x={A[0]} y={A[1]} kind="app" label="App" w={96} />
        <Node x={Q[0]} y={Q[1]} kind="queue" label="Queue" w={88} state={st === 1 || st === 2 ? 'warn' : 'normal'} />
        <Node x={WK[0]} y={WK[1]} kind="server" label="Worker" sub={st === 3 || st === 4 ? 'processing…' : st >= 5 ? 'done' : 'waiting'} w={96} state={st === 3 || st === 4 ? 'active' : st >= 5 ? 'ok' : 'normal'} />
        {FY.map((y, i) => (
          <Node key={y} x={520} y={y} kind="client" label={`F${i + 1}`} sub="follower" w={76} h={40} state={st >= 4 ? "ok" : "dim"} />
        ))}
        {st === 1 && (
          <>
            <Packet key="p1" path={line(...ua)} to={ua[1]} label="post" />
            <Packet key="p2" path={line(...aq)} to={aq[1]} label="job" tone="warn" delay={0.8} />
            <Packet key="p3" path={line(ua[1], ua[0])} to={ua[0]} label="ok" tone="ok" delay={1.5} />
          </>
        )}
        {st === 2 && <Badge x={U[0]} y={U[1] + 38} text="not blocked" tone="ok" />}
        {st === 3 && <Packet key="p4" path={line(...qw)} to={qw[1]} label="job" tone="warn" />}
        {st === 4 && FY.map((y, i) => <Packet key={`f${i}`} path={line(...wf(y))} to={wf(y)[1]} label="tw" delay={i * 0.25} />)}
        {st === 5 && <Badge x={WK[0]} y={WK[1] - 36} text="job complete ✓" tone="ok" />}
      </Diagram>
    </ProcessPlayer>
  )
}

/** Task queue: tasks with data in, run (optionally on a schedule), results out. */
export function TaskQueueVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={210} title="Task queue: receives tasks and their data, runs them in the background, delivers results">
        <Wire d={line([116, 105], [184, 105])} state={st === 1 ? 'active' : 'idle'} />
        <Wire d={line([300, 105], [366, 105])} state={st === 3 ? 'ok' : 'idle'} />
        <Node x={64} y={105} kind="app" label="App" sub="submits tasks" w={104} />
        <Node x={242} y={105} kind="queue" label="Task queue" sub={st === 4 ? 'scheduled' : 'e.g. Celery'} w={116} state={st === 2 ? 'active' : st === 4 ? 'warn' : 'normal'} />
        <Node x={430} y={105} kind="app" label="Results" sub="delivered" w={112} state={st >= 3 ? 'ok' : 'normal'} />
        {st === 1 && <Packet key="t1" path={line([116, 105], [184, 105])} to={[184, 105]} label="task" />}
        {st === 2 && (
          <g transform="translate(242,160)">
            <rect x={-70} width={140} height={10} rx={5} fill="var(--surface-2)" />
            <rect x={-70} width={140} height={10} rx={5} fill="var(--accent)" style={{ animation: 'grow-x 1.6s ease-out both', transformOrigin: 'left' }} />
            <text y={26} fontSize={10} textAnchor="middle" className="muted">
              running a compute-heavy job in the background
            </text>
          </g>
        )}
        {st === 3 && <Packet key="t2" path={line([300, 105], [366, 105])} to={[366, 105]} label="✓" tone="ok" />}
        {st === 4 && (
          <g transform="translate(242,40)">
            <circle r={14} fill="var(--warn-soft)" stroke="var(--warn)" />
            <path d="M0 -7V0l5 4" stroke="var(--warn)" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
        )}
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ back pressure simulation */

/**
 * Illustrative simulation: work arrives at a chosen rate; workers drain a fixed amount per tick. Without back
 * pressure the queue grows past "memory" and service slows (the Primer: cache misses, disk reads). With back
 * pressure the queue is capped; extra requests get HTTP 503 and retry later with exponential backoff.
 */
export function BackPressureSim(_: VisualProps) {
  const [rate, setRate] = useState(7)
  const [limit, setLimit] = useState(true)
  const [running, setRunning] = useState(false)
  const CAP = 4 // jobs per tick the workers can do when the queue fits in memory
  const MEMORY = 40
  const MAX = 20 // queue cap with back pressure
  const sim = useRef({ q: 0, served: 0, rejected: 0, retries: [] as number[], tick: 0 })
  const [hist, setHist] = useState<number[]>([])
  const [stats, setStats] = useState({ q: 0, served: 0, rejected: 0, slow: false })

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      const s = sim.current
      s.tick++
      // retries come back after their backoff
      const due = s.retries.filter((r) => r <= s.tick).length
      s.retries = s.retries.filter((r) => r > s.tick)
      let incoming = rate + due
      if (limit) {
        const room = Math.max(0, MAX - s.q)
        const rejected = Math.max(0, incoming - room)
        s.rejected += rejected
        for (let i = 0; i < rejected; i++) s.retries.push(s.tick + Math.min(16, 2 ** (1 + (i % 4))))
        incoming -= rejected
      }
      s.q += incoming
      const peak = s.q // occupancy before workers drain it this tick (what the cap limits)
      const slow = s.q > MEMORY
      const capacity = slow ? Math.floor(CAP / 2) : CAP
      const done = Math.min(s.q, capacity)
      s.q -= done
      s.served += done
      setHist((h) => [...h.slice(-59), peak])
      setStats({ q: peak, served: s.served, rejected: s.rejected, slow })
    }, 300)
    return () => clearInterval(t)
  }, [running, rate, limit])

  const reset = () => {
    setRunning(false)
    sim.current = { q: 0, served: 0, rejected: 0, retries: [], tick: 0 }
    setHist([])
    setStats({ q: 0, served: 0, rejected: 0, slow: false })
  }
  const W = 520
  const H = 120
  const maxY = Math.max(60, ...hist)
  const pts = hist.map((v, i) => `${(i / 59) * W},${H - (v / maxY) * H}`).join(' ')
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Arrivals per tick
          <input type="range" min={1} max={12} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="accent-[var(--accent)]" />
          <span className="w-5 tabular-nums">{rate}</span>
        </label>
        <span className="text-xs text-muted">Workers handle {CAP}/tick</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={limit} onChange={(e) => setLimit(e.target.checked)} className="accent-[var(--accent)]" />
          Back pressure (cap queue at {MAX})
        </label>
      </div>
      <div className="rounded-lg bg-bg/60 p-2">
        <Diagram width={560} height={160} title="Queue length over time">
          <g transform="translate(30,16)">
            <rect width={W} height={H} fill="none" stroke="var(--border)" />
            <line x1={0} x2={W} y1={H - (MEMORY / maxY) * H} y2={H - (MEMORY / maxY) * H} stroke="var(--bad)" strokeDasharray="4 4" />
            <text x={W - 4} y={H - (MEMORY / maxY) * H - 4} fontSize={9.5} textAnchor="end" style={{ fill: 'var(--bad)' }}>
              bigger than memory: slower
            </text>
            {limit && (
              <>
                <line x1={0} x2={W} y1={H - (MAX / maxY) * H} y2={H - (MAX / maxY) * H} stroke="var(--ok)" strokeDasharray="4 4" />
                <text x={4} y={H - (MAX / maxY) * H - 4} fontSize={9.5} style={{ fill: 'var(--ok)' }}>
                  queue cap
                </text>
              </>
            )}
            <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
          </g>
          <text x={14} y={80} fontSize={9.5} className="muted" transform="rotate(-90 14 80)" textAnchor="middle">
            queue length
          </text>
        </Diagram>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setRunning((r) => !r)} className={`btn btn-sm ${running ? 'btn-secondary' : 'btn-primary'}`}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={reset} className="btn btn-sm btn-secondary">
          Reset
        </button>
        <span className="tabular-nums">queue {stats.q}</span>
        <span className="text-ok tabular-nums">served {stats.served}</span>
        <span className="text-warn tabular-nums">503s {stats.rejected}</span>
        {stats.slow && <span className="text-bad">queue larger than memory: workers slowed</span>}
      </div>
      <p className="text-xs text-muted">
        “Once the queue fills up, clients get a server busy or HTTP 503 status code to try again later.”
        <LineRef claim={q('Once the queue fills up, clients get a server busy or HTTP 503 status code to try again later.', 1357)} /> Rejected requests retry
        with exponential backoff. Rates and sizes here are illustrative.
      </p>
    </div>
  )
}
