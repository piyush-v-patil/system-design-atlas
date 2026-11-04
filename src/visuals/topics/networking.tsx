import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { bullets } from '../auto.ts'
import { Badge, Caption, curve, Diagram, line, Node, Packet, Wire, type WireState } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { LineRef } from '../kit/Claims.tsx'

type P = [number, number]
const back = ([a, b]: [P, P]): [P, P] => [b, a]

/* ------------------------------------------------------------------ DNS lookup */

export function DnsVisual({ visual, node }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const C: P = [80, 210]
  const ISP: P = [306, 210]
  const ROOT: P = [306, 62]
  const WEB: P = [478, 128]
  const ci: [P, P] = [[152, 210], [240, 210]]
  const ir: [P, P] = [[306, 182], [306, 90]]
  const cw: [P, P] = [[150, 196], [402, 136]]
  const ispCached = st >= 3
  const clientCached = st >= 4
  const all = bullets(topics.nodes[node.id])
  const records = all.filter((b) => b.depth === 0 && /^\*\*/.test(b.md))
  const routing = all.filter((b) => b.depth === 0 && /^\[/.test(b.md))
  const w = (k: string, on: boolean): WireState => (on ? 'active' : k === 'cw' ? 'faded' : 'idle')
  return (
    <ProcessPlayer
      steps={steps}
      stepper={s}
      aside={
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-line p-2">
            <div className="mb-1 font-semibold">Record types</div>
            <ul className="flex flex-col gap-1">
              {records.map((r, i) => (
                <li key={i}>
                  <span className="font-mono font-semibold text-[var(--accent)]">{r.claim.text.split(' - ')[0]}</span>{' '}
                  <span className="text-muted">{r.claim.text.split(' - ').slice(1).join(' - ')}</span>
                  <LineRef claim={r.claim} />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-line p-2">
            <div className="mb-1 font-semibold">Routing some DNS services offer</div>
            <ul className="flex flex-col gap-1">
              {routing.map((r, i) => (
                <li key={i}>
                  {r.claim.text}
                  <LineRef claim={r.claim} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
    >
      <Diagram width={560} height={262} title="DNS lookup: the client asks its ISP's DNS server, which asks a server higher up, caches the answer, and returns the IP">
        <Wire d={line(...ci)} state={w('ci', st === 1 || st === 3 || st === 6)} arrow="both" />
        <Wire d={line(...ir)} state={w('ir', st === 2 || st === 3)} arrow="both" />
        <Wire d={line(...cw)} state={w('cw', st === 5)} />
        <Node x={C[0]} y={C[1]} kind="client" label="Your computer" sub={clientCached ? 'cached · TTL' : 'browser + OS'} w={144} state={clientCached ? 'ok' : 'normal'} />
        <Node x={ISP[0]} y={ISP[1]} kind="dns" label="ISP DNS server" sub={ispCached ? 'cached' : 'lower level'} w={130} state={st === 2 ? 'warn' : ispCached ? 'ok' : 'normal'} />
        <Node x={ROOT[0]} y={ROOT[1]} kind="dns" label="Root DNS server" sub="top of the hierarchy" w={140} state={st === 2 ? 'active' : 'normal'} />
        <Node x={WEB[0]} y={WEB[1]} kind="server" label="www.example.com" sub="203.0.113.10" w={150} state={st === 5 ? 'active' : 'normal'} />
        {st === 2 && <Badge x={ISP[0]} y={ISP[1] + 38} text="not in my cache" tone="warn" />}
        {st === 6 && <Badge x={C[0]} y={C[1] - 36} text="answered from cache" tone="ok" />}
        {st === 1 && <Packet key="q1" path={line(...ci)} to={ci[1]} label="?" />}
        {st === 2 && <Packet key="q2" path={line(...ir)} to={ir[1]} label="?" />}
        {st === 3 && (
          <>
            <Packet key="a1" path={line(...back(ir))} to={ir[0]} label="IP" tone="ok" />
            <Packet key="a2" path={line(...back(ci))} to={ci[0]} label="IP" tone="ok" delay={1} />
          </>
        )}
        {st === 5 && <Packet key="c" path={line(...cw)} to={cw[1]} label="GET" />}
        <Caption x={540} y={252} anchor="end" tone="muted">
          IP shown is a documentation example
        </Caption>
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ CDN push vs pull */

type CdnMode = 'pull' | 'push'
export function CdnVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<CdnMode>((visual.props?.mode as CdnMode) ?? 'pull')
  const steps = visual.stepsByMode?.[mode] ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const O: P = [280, 140]
  const EDGES: { p: P; label: string; user: P }[] = [
    { p: [90, 62], label: 'Edge: Americas', user: [90, 200] },
    { p: [470, 62], label: 'Edge: Europe', user: [470, 200] },
  ]
  const oe = (i: number): [P, P] => [[O[0] + (i ? 52 : -52), O[1] - 14], [EDGES[i].p[0] + (i ? -58 : 58), EDGES[i].p[1] + 10]]
  const ue = (i: number): [P, P] => [[EDGES[i].user[0], EDGES[i].user[1] - 22], [EDGES[i].p[0], EDGES[i].p[1] + 24]]
  // content state per edge
  const has = (i: number) => (mode === 'pull' ? (i === 0 ? st >= 1 && st < 4 : false) || (i === 0 && st >= 4) : st >= 1)
  const stale = mode === 'pull' && st === 4
  return (
    <ProcessPlayer
      steps={steps}
      stepper={s}
      header={
        <ModeToggle
          label="CDN type"
          value={mode}
          onChange={(m) => (setMode(m), s.reset())}
          options={[
            { value: 'pull', label: 'Pull CDN' },
            { value: 'push', label: 'Push CDN' },
          ]}
        />
      }
    >
      <Diagram width={560} height={250} title={`${mode} CDN: how content gets from your server to edge servers near users`}>
        {EDGES.map((e, i) => (
          <g key={i}>
            <Wire d={curve(...oe(i), i ? 16 : -16)} state={(mode === 'push' && (st === 1 || st === 4)) || (mode === 'pull' && i === 0 && (st === 1 || st === 4)) ? 'active' : 'idle'} />
            <Wire d={line(...ue(i))} state={(mode === 'pull' && i === 0 && st >= 1) || st === 3 ? 'active' : 'idle'} arrow="both" />
            <Node x={e.p[0]} y={e.p[1]} kind="server" label={e.label} sub={has(i) ? (stale ? 'TTL expired' : 'has the file') : 'empty'} w={140} state={has(i) ? (stale ? 'warn' : 'ok') : 'normal'} />
            <Node x={e.user[0]} y={e.user[1]} kind="client" label="Nearby users" w={120} h={44} />
          </g>
        ))}
        <Node x={O[0]} y={O[1]} kind="server" label="Your server" sub={mode === 'push' && st === 2 ? 'URLs → CDN' : 'origin'} w={112} state={(mode === 'push' && st === 1) || (mode === 'pull' && st === 1) ? 'active' : 'normal'} />
        {mode === 'pull' && st === 1 && (
          <>
            <Packet key="p1" path={line(...ue(0))} to={ue(0)[1]} label="GET" />
            <Packet key="p2" path={curve(...back(oe(0)), 16)} to={oe(0)[0]} label="?" delay={0.9} />
            <Packet key="p3" path={curve(...oe(0), -16)} to={oe(0)[1]} label="file" tone="ok" delay={1.8} />
          </>
        )}
        {mode === 'pull' && st === 2 && <Badge x={EDGES[0].user[0]} y={EDGES[0].user[1] + 32} text="first request: slower" tone="warn" />}
        {st === 3 &&
          EDGES.map((_e, i) =>
            mode === 'pull' && i === 1 ? null : <Packet key={`u${i}`} path={line(...back(ue(i)))} to={ue(i)[0]} label="file" tone="ok" />,
          )}
        {mode === 'pull' && st === 4 && <Packet key="r" path={curve(...oe(0), -16)} to={oe(0)[1]} label="same" tone="warn" />}
        {mode === 'pull' && st === 4 && <Caption x={280} y={238} tone="warn">re-pulled though it hadn’t changed</Caption>}
        {mode === 'push' && (st === 1 || st === 4) && EDGES.map((_, i) => <Packet key={`pu${st}${i}`} path={curve(...oe(i), i ? 16 : -16)} to={oe(i)[1]} label={st === 4 ? 'new' : 'file'} delay={i * 0.2} />)}
        {mode === 'push' && st === 4 && <Caption x={280} y={238} tone="muted">only new or changed files are uploaded</Caption>}
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ reverse proxy */

export function ReverseProxyVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const I: P = [70, 128]
  const PX: P = [262, 128]
  const SV = [62, 128, 194]
  const ip: [P, P] = [[118, 120], [210, 120]]
  const ipb: [P, P] = [[118, 140], [210, 140]]
  const ps = (i: number): [P, P] => [[314, 128], [402, SV[i]]]
  const toServer = st === 1 || st === 3 || st === 4
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={250} title="Reverse proxy between the internet and the web servers on an internal network">
        <rect x={196} y={20} width={350} height={214} rx={14} fill="none" stroke="var(--border)" strokeDasharray="5 4" />
        <text x={530} y={226} fontSize={10} textAnchor="end" className="muted">
          internal network (example.com)
        </text>
        <Wire d={line(...ip)} state={st >= 1 ? 'active' : 'idle'} />
        <Wire d={line(...ipb)} state={st === 2 ? 'bad' : 'faded'} />
        {SV.map((_, i) => (
          <Wire key={i} d={line(...ps(i))} state={toServer && i === 1 ? 'active' : 'faded'} />
        ))}
        <Node x={I[0]} y={I[1]} kind="client" label="Internet" sub="clients" w={100} />
        <Node x={PX[0]} y={PX[1]} kind="lb" label="Reverse proxy" sub="public IP" w={112} state="active" />
        {SV.map((y, i) => (
          <Node key={i} x={460} y={y} kind="server" label={`Web server ${i + 1}`} sub="hidden" w={116} h={46} state={st === 5 || st === 6 ? 'dim' : 'normal'} />
        ))}
        {st === 1 && <Badge x={PX[0]} y={PX[1] - 36} text="only this IP is visible" tone="accent" />}
        {st === 2 && <Badge x={PX[0]} y={PX[1] + 40} text="blocked IP" tone="bad" />}
        {st === 3 && (
          <>
            <Badge x={164} y={104} text="🔒 HTTPS" tone="ok" />
            <Badge x={358} y={112} text="plain" tone="accent" />
          </>
        )}
        {st === 4 && <Badge x={164} y={104} text="gzip" tone="ok" />}
        {st === 5 && <Badge x={PX[0]} y={PX[1] - 36} text="cached response" tone="ok" />}
        {st === 6 && <Badge x={PX[0]} y={PX[1] - 36} text="HTML/CSS/JS, photos, videos" tone="ok" />}
        {st >= 1 && st !== 2 && <Packet key={`in${st}`} path={line(...ip)} to={ip[1]} label="req" />}
        {st === 2 && <Packet key="bad" path={line(...ipb)} to={ipb[1]} label="✕" tone="bad" />}
        {toServer && <Packet key={`s${st}`} path={line(...ps(1))} to={ps(1)[1]} label="req" delay={0.8} />}
        {(st === 5 || st === 6) && <Packet key={`r${st}`} path={line(ip[1], ip[0])} to={ip[0]} label="res" tone="ok" delay={0.8} />}
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ load balancer vs reverse proxy */

export function LbVsProxyVisual(_: VisualProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(['lb', 'proxy'] as const).map((k) => (
        <div key={k} className="rounded-xl border border-line bg-surface p-2">
          <div className="mb-1 px-1 text-xs font-semibold">{k === 'lb' ? 'Load balancer: many servers, same function' : 'Reverse proxy: useful even with one server'}</div>
          <Diagram width={280} height={170} title={k === 'lb' ? 'Load balancer spreading requests over identical servers' : 'Reverse proxy in front of a single web server'}>
            <Node x={46} y={85} kind="client" label="" w={44} h={40} />
            <Wire d={line([70, 85], [104, 85])} state="active" />
            <Node x={140} y={85} kind="lb" label={k === 'lb' ? 'LB' : 'Proxy'} w={70} h={40} state="active" />
            {(k === 'lb' ? [30, 85, 140] : [85]).map((y) => (
              <g key={y}>
                <Wire d={line([176, 85], [206, y])} state="active" />
                <Node x={240} y={y} kind="server" label="" w={60} h={36} />
              </g>
            ))}
          </Diagram>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ application layer */

export function AppLayerVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const platform = st >= 2 ? 4 : 3
  const webY = [60, 125, 190]
  const platY = platform === 4 ? [44, 98, 152, 206] : [60, 125, 190]
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={256} title="Web layer and application (platform) layer scaled independently, with workers">
        <Node x={40} y={125} kind="client" label="" w={44} h={40} />
        <Wire d={line([64, 125], [92, 125])} state="active" />
        <Node x={118} y={125} kind="lb" label="LB" w={56} h={40} />
        {webY.map((y) => (
          <Wire key={y} d={line([146, 125], [190, y])} state="idle" />
        ))}
        {webY.map((y) =>
          platY.map((py) => <Wire key={`${y}-${py}`} d={line([290, y], [340, py])} state={st === 1 ? 'active' : 'faded'} arrow="none" />),
        )}
        {webY.map((y, i) => (
          <Node key={y} x={240} y={y} kind="server" label={`Web ${i + 1}`} w={96} h={40} state={st === 1 ? 'active' : 'normal'} />
        ))}
        {platY.map((y, i) => (
          <Node key={`${platform}-${y}`} x={390} y={y} kind="app" label={i === 3 ? 'New API' : `Platform ${i + 1}`} w={98} h={40} state={i === 3 && st === 2 ? 'ok' : st === 1 || st === 3 ? 'active' : 'normal'} />
        ))}
        {platY.map((py) =>
          [98, 178].map((dy) => <Wire key={`d${py}-${dy}`} d={line([439, py], [480, dy])} state={st === 1 ? 'active' : 'faded'} arrow="none" />),
        )}
        <Node x={510} y={98} kind="db" label="DB" w={60} h={50} />
        <Node x={510} y={178} kind="db" label="DB" w={60} h={50} />
        {st === 2 && <Badge x={240} y={226} text="web servers unchanged" tone="ok" />}
        {st === 4 && (
          <>
            <Node x={390} y={238} kind="queue" label="Workers" w={98} h={30} state="ok" />
            <Caption x={250} y={244} tone="ok">
              async jobs →
            </Caption>
          </>
        )}
        <text x={240} y={20} fontSize={10} textAnchor="middle" className="muted">
          web layer
        </text>
        <text x={390} y={20} fontSize={10} textAnchor="middle" className="muted">
          application (platform) layer
        </text>
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ microservices */

const SERVICES = ['user profile', 'follower', 'feed', 'search', 'photo upload']
export function MicroservicesVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const pos: P[] = [
    [100, 60],
    [280, 50],
    [460, 60],
    [160, 190],
    [400, 190],
  ]
  const deploying = st === 4 ? 2 : -1
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={250} title="Pinterest-style microservices: independently deployable services talking over lightweight calls">
        {st >= 2 &&
          [
            [0, 2],
            [1, 2],
            [2, 3],
            [2, 4],
            [0, 1],
          ].map(([a, b]) => <Wire key={`${a}${b}`} d={line(pos[a], pos[b])} state={st === 2 ? 'active' : 'idle'} arrow="none" dashed />)}
        {SERVICES.map((name, i) => (
          <g key={name}>
            <Node x={pos[i][0]} y={pos[i][1]} kind="app" label={name} sub={deploying === i ? 'deploying v2…' : 'own process'} w={130} h={46} state={deploying === i ? 'warn' : st >= 1 ? 'active' : 'normal'} />
          </g>
        ))}
        {st === 2 && <Packet key="m1" path={line(pos[2], pos[3])} to={pos[3]} label="call" />}
        {st === 3 && <Caption x={280} y={128} tone="muted">example services from the Primer (Pinterest)</Caption>}
        {st === 4 && <Caption x={280} y={128} tone="warn">one service redeploys; the rest keep running</Caption>}
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ service discovery */

export function ServiceDiscoveryVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const REG: P = [280, 70]
  const A: P = [90, 196]
  const B: P = [470, 196]
  const ra: [P, P] = [[A[0] + 30, A[1] - 26], [REG[0] - 40, REG[1] + 30]]
  const rb: [P, P] = [[B[0] - 30, B[1] - 26], [REG[0] + 40, REG[1] + 30]]
  const ab: [P, P] = [[A[0] + 62, A[1]], [B[0] - 62, B[1]]]
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={256} title="Service discovery: services register, are health-checked, and look each other up">
        <Wire d={line(...ra)} state={st === 1 || st === 3 ? 'active' : 'idle'} arrow="both" />
        <Wire d={line(...rb)} state={st === 1 || st === 2 ? 'active' : 'idle'} arrow="both" />
        <Wire d={line(...ab)} state={st === 3 ? 'ok' : 'faded'} />
        <Node x={REG[0]} y={REG[1]} kind="dns" label="Registry" sub="Consul · Etcd · Zookeeper" w={176} state="active" />
        <Node x={A[0]} y={A[1]} kind="app" label="Service A" sub={st >= 1 ? '10.0.0.5:8080' : undefined} w={120} />
        <Node x={B[0]} y={B[1]} kind="app" label="Service B" sub={st >= 1 ? '10.0.0.9:9000' : undefined} w={120} state={st === 2 ? 'ok' : 'normal'} />
        {st >= 1 && (
          <g transform="translate(372,24)">
            <rect width={176} height={st >= 4 ? 70 : 42} rx={8} fill="var(--surface)" stroke="var(--border)" />
            <text x={8} y={16} fontSize={9.5} className="muted">
              name → address:port
            </text>
            <text x={8} y={30} fontSize={9.5}>
              A → 10.0.0.5:8080 · B → 10.0.0.9:9000
            </text>
            {st >= 4 && (
              <>
                <text x={8} y={48} fontSize={9.5} className="muted">
                  key-value config
                </text>
                <text x={8} y={62} fontSize={9.5}>
                  feature.flag = on
                </text>
              </>
            )}
          </g>
        )}
        {st === 1 && (
          <>
            <Packet key="r1" path={line(...ra)} to={ra[1]} label="reg" />
            <Packet key="r2" path={line(...rb)} to={rb[1]} label="reg" delay={0.3} />
          </>
        )}
        {st === 2 && <Packet key="hc" path={line(...back(rb))} to={rb[0]} label="/health" tone="ok" />}
        {st === 2 && <Badge x={B[0]} y={B[1] + 38} text="healthy" tone="ok" />}
        {st === 3 && (
          <>
            <Packet key="l1" path={line(...ra)} to={ra[1]} label="B?" />
            <Packet key="l2" path={line(...ab)} to={ab[1]} label="call" tone="ok" delay={1} />
          </>
        )}
        <Caption x={540} y={250} anchor="end" tone="muted">
          addresses are illustrative
        </Caption>
      </Diagram>
    </ProcessPlayer>
  )
}
