import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Caption, curve, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'

type Mode = 'active-passive' | 'active-active'
type P = [number, number]
const CL: P = [72, 128]
const MIDN: P = [236, 128]
const A: P = [430, 60]
const B: P = [430, 196]
const HB = curve([484, 66], [484, 190], -34)

function PassiveDiagram({ step, standby }: { step: number; standby: 'hot' | 'cold' }) {
  const aDown = step >= 3
  const ipOnB = step >= 4
  const toA = line([124, 120], [378, 64])
  const toB = line([124, 136], [378, 192])
  return (
    <Diagram width={560} height={256} title="Active-passive fail-over: heartbeats, failure, and the passive server taking over the IP address">
      <Wire d={toA} state={aDown ? 'broken' : step >= 1 ? 'active' : 'idle'} />
      <Wire d={toB} state={ipOnB ? 'active' : 'faded'} dashed={!ipOnB} />
      <Wire d={HB} state={step === 3 ? 'broken' : step === 2 ? 'active' : aDown ? 'faded' : 'idle'} arrow="none" label="heartbeat" labelAt={[530, 132]} />
      <Node x={CL[0]} y={CL[1]} kind="client" label="Clients" w={100} />
      <Node x={A[0]} y={A[1]} kind="server" label="Server A" sub={aDown ? 'failed' : 'active'} w={108} state={aDown ? 'down' : 'active'} />
      <Node
        x={B[0]}
        y={B[1]}
        kind="server"
        label="Server B"
        sub={ipOnB ? (standby === 'cold' && step === 4 ? 'starting up…' : 'active') : `passive (${standby})`}
        w={108}
        state={ipOnB ? (standby === 'cold' && step === 4 ? 'warn' : 'active') : 'standby'}
      />
      <Badge x={ipOnB ? B[0] : A[0]} y={ipOnB ? B[1] + 42 : A[1] - 34} text="IP 10.0.0.1" tone="accent" />
      {step === 1 && [0, 0.6].map((d) => <Packet key={`a${d}`} path={toA} to={[378, 64]} delay={d} />)}
      {step === 2 && (
        <>
          <Packet key="h1" path={HB} to={[484, 190]} label="♥" tone="ok" />
          <Packet key="h2" path={curve([484, 190], [484, 66], 34)} to={[484, 66]} label="♥" tone="ok" delay={1} />
        </>
      )}
      {step === 3 && <Caption x={520} y={250} anchor="end" tone="bad">heartbeat interrupted</Caption>}
      {step >= 4 && [0, 0.6].map((d) => <Packet key={`b${step}${d}`} path={toB} to={[378, 192]} delay={d + (standby === 'cold' && step === 4 ? 1.2 : 0)} tone="ok" />)}
      {step === 5 && (
        <g transform="translate(150,228)">
          <text fontSize={10} className="muted" y={-6}>downtime while B takes over</text>
          <rect width={170} height={10} rx={5} fill="var(--surface-2)" stroke="var(--border)" />
          <rect width={standby === 'hot' ? 30 : 150} height={10} rx={5} fill={standby === 'hot' ? 'var(--ok)' : 'var(--warn)'} style={{ transition: 'width 400ms' }} />
          <text x={178} y={9} fontSize={10} style={{ fill: standby === 'hot' ? 'var(--ok)' : 'var(--warn)', fontWeight: 600 }}>
            {standby === 'hot' ? 'hot: already running' : 'cold: must start up'}
          </text>
        </g>
      )}
    </Diagram>
  )
}

function ActiveDiagram({ step }: { step: number }) {
  const internal = step >= 3
  const aDown = step >= 4
  const showRouter = step >= 2
  const toA = showRouter ? line([288, 120], [376, 66]) : line([124, 120], [376, 64])
  const toB = showRouter ? line([288, 136], [376, 190]) : line([124, 136], [376, 192])
  return (
    <Diagram width={560} height={256} title="Active-active fail-over: both servers manage traffic">
      {showRouter && <Wire d={line([124, 128], [182, 128])} state="active" />}
      <Wire d={toA} state={aDown ? 'broken' : 'active'} />
      <Wire d={toB} state="active" />
      <Node x={CL[0]} y={CL[1]} kind="client" label={internal ? 'Services' : 'Clients'} w={100} />
      {showRouter && (
        <Node x={MIDN[0]} y={MIDN[1]} kind={internal ? 'app' : 'dns'} label={internal ? 'App logic' : 'DNS'} sub="knows A and B" w={108} state="active" />
      )}
      <Node x={A[0]} y={A[1]} kind="server" label="Server A" sub={aDown ? 'failed' : internal ? 'internal' : 'public IP A'} w={108} state={aDown ? 'down' : 'active'} />
      <Node x={B[0]} y={B[1]} kind="server" label="Server B" sub={internal ? 'internal' : 'public IP B'} w={108} state="active" />
      {step >= 1 && !aDown && <Packet key={`a${step}`} path={toA} to={[376, 66]} />}
      {step >= 1 && <Packet key={`b${step}`} path={toB} to={[376, 190]} delay={aDown ? 0 : 0.5} tone={aDown ? 'ok' : 'accent'} />}
      {aDown && <Packet key="b2" path={toB} to={[376, 190]} delay={0.6} tone="ok" />}
      {step >= 1 && !aDown && <Caption x={530} y={132} anchor="end" tone="muted">load spread across both</Caption>}
      {aDown && <Caption x={530} y={132} anchor="end" tone="ok">B keeps serving</Caption>}
    </Diagram>
  )
}

export function FailoverVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<Mode>((visual.props?.mode as Mode) ?? 'active-passive')
  const [standby, setStandby] = useState<'hot' | 'cold'>('hot')
  const steps = visual.stepsByMode?.[mode] ?? []
  const stepper = useStepper(steps.length)
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      header={
        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle
            label="Fail-over pattern"
            value={mode}
            onChange={(m) => (setMode(m), stepper.reset())}
            options={[
              { value: 'active-passive', label: 'Active-passive' },
              { value: 'active-active', label: 'Active-active' },
            ]}
          />
          {mode === 'active-passive' && (
            <ModeToggle
              label="Standby"
              value={standby}
              onChange={setStandby}
              options={[
                { value: 'hot', label: 'Hot standby' },
                { value: 'cold', label: 'Cold standby' },
              ]}
            />
          )}
        </div>
      }
    >
      {mode === 'active-passive' ? <PassiveDiagram step={stepper.step} standby={standby} /> : <ActiveDiagram step={stepper.step} />}
    </ProcessPlayer>
  )
}
