import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Caption, curve, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'

type Mode = 'master-slave' | 'master-master'
type P = [number, number]

function MasterSlave({ step }: { step: number }) {
  const APP: P = [70, 130]
  const M: P = [250, 130]
  const S1: P = [440, 46]
  const S2: P = [440, 136]
  const S3: P = [440, 222]
  const masterDown = step >= 5
  const promoted = step >= 6
  const w = line([122, 130], [198, 130])
  const r1 = line([304, 118], [386, 54])
  const r2 = line([304, 134], [386, 136])
  const r23 = line([440, 162], [440, 196])
  const read1 = curve([110, 108], [386, 40], 70)
  const read2 = curve([110, 154], [386, 150], -70)
  const toS1 = curve([110, 110], [386, 50], 64)
  return (
    <Diagram width={560} height={262} title="Master-slave replication: writes to the master, replicated to slaves that serve reads">
      <Wire d={w} state={masterDown && !promoted ? 'broken' : step === 1 ? 'active' : promoted ? 'faded' : 'idle'} />
      <Wire d={r1} state={masterDown ? 'faded' : step === 2 ? 'active' : 'idle'} arrow="end" label="replicate" labelAt={[350, 78]} />
      <Wire d={r2} state={masterDown ? 'faded' : step === 2 ? 'active' : 'idle'} arrow="end" />
      <Wire d={r23} state={step === 4 ? 'active' : 'idle'} arrow="end" />
      {(step === 3 || masterDown) && !promoted && <Wire d={read1} state="ok" arrow="end" />}
      {(step === 3 || masterDown) && <Wire d={read2} state="ok" arrow="end" />}
      {promoted && <Wire d={toS1} state="active" arrow="end" label="writes" labelAt={[230, 46]} />}
      <Node x={APP[0]} y={APP[1]} kind="app" label="App" w={96} />
      <Node x={M[0]} y={M[1]} kind="db" label="Master" sub={masterDown ? 'offline' : 'reads + writes'} w={108} h={56} state={masterDown ? 'down' : step === 1 ? 'active' : 'normal'} />
      <Node x={S1[0]} y={S1[1]} kind="db" label={promoted ? 'New master' : 'Slave 1'} sub={promoted ? 'promoted' : 'reads only'} w={112} h={52} state={promoted ? 'active' : 'normal'} />
      <Node x={S2[0]} y={S2[1]} kind="db" label="Slave 2" sub="reads only" w={112} h={52} />
      <Node x={S3[0]} y={S3[1]} kind="db" label="Slave 3" sub="replica of slave 2" w={112} h={52} state={step === 4 ? 'active' : 'normal'} />
      {masterDown && !promoted && <Badge x={160} y={190} text="read-only mode" tone="warn" />}
      {step === 1 && <Packet key="w1" path={w} to={[198, 130]} label="W" />}
      {step === 2 && (
        <>
          <Packet key="r1" path={r1} to={[386, 54]} label="W" />
          <Packet key="r2" path={r2} to={[386, 136]} label="W" delay={0.2} />
        </>
      )}
      {step === 3 && (
        <>
          <Packet key="q1" path={read1} to={[386, 40]} label="R" tone="ok" />
          <Packet key="q2" path={read2} to={[386, 150]} label="R" tone="ok" delay={0.4} />
        </>
      )}
      {step === 4 && <Packet key="r3" path={r23} to={[440, 196]} label="W" />}
      {step === 5 && <Packet key="wx" path={w} to={[198, 130]} label="✕" tone="bad" />}
      {step === 6 && <Packet key="wp" path={toS1} to={[386, 50]} label="W" />}
      {step === 5 && <Caption x={160} y={214} tone="muted">writes fail, reads continue</Caption>}
    </Diagram>
  )
}

function MasterMaster({ step }: { step: number }) {
  const APP: P = [64, 130]
  const LB: P = [208, 130]
  const M1: P = [420, 58]
  const M2: P = [420, 202]
  const viaLb = step >= 3
  const m1Down = step >= 5
  const src: P = viaLb ? [260, 130] : [116, 130]
  const to1 = line([src[0], src[1] - 10], [366, 66])
  const to2 = line([src[0], src[1] + 10], [366, 194])
  const sync = line([420, 86], [420, 174])
  return (
    <Diagram width={560} height={262} title="Master-master replication: both masters serve reads and writes and coordinate on writes">
      {viaLb && <Wire d={line([116, 130], [156, 130])} state="active" />}
      <Wire d={to1} state={m1Down ? 'broken' : step === 1 || step === 4 ? 'active' : 'idle'} />
      <Wire d={to2} state={step === 1 || step >= 4 ? 'active' : 'idle'} />
      <Wire d={sync} state={step === 2 ? 'active' : step === 4 ? 'bad' : m1Down ? 'faded' : 'idle'} arrow="both" label="coordinate" labelAt={[470, 134]} />
      <Node x={APP[0]} y={APP[1]} kind="app" label="App" w={92} />
      {viaLb && <Node x={LB[0]} y={LB[1]} kind="lb" label="Load balancer" sub="decides where" w={116} state="active" />}
      <Node x={M1[0]} y={M1[1]} kind="db" label="Master 1" sub={m1Down ? 'down' : 'reads + writes'} w={112} h={56} state={m1Down ? 'down' : 'normal'} />
      <Node x={M2[0]} y={M2[1]} kind="db" label="Master 2" sub="reads + writes" w={112} h={56} state={m1Down ? 'active' : 'normal'} />
      {step === 4 && <Badge x={480} y={110} text="conflict: x=1 vs x=2" tone="bad" />}
      {(step === 1 || step === 3) && (
        <>
          <Packet key={`a${step}`} path={to1} to={[366, 66]} label="W" />
          <Packet key={`b${step}`} path={to2} to={[366, 194]} label="R" tone="ok" delay={0.4} />
        </>
      )}
      {step === 2 && (
        <>
          <Packet key="s1" path={sync} to={[420, 174]} label="W" />
          <Packet key="s2" path={line([420, 174], [420, 86])} to={[420, 86]} label="W" delay={1} />
        </>
      )}
      {step === 4 && (
        <>
          <Packet key="c1" path={to1} to={[366, 66]} label="1" tone="warn" />
          <Packet key="c2" path={to2} to={[366, 194]} label="2" tone="warn" />
        </>
      )}
      {step === 5 && (
        <>
          <Packet key="d1" path={to2} to={[366, 194]} label="W" tone="ok" />
          <Packet key="d2" path={to2} to={[366, 194]} label="R" tone="ok" delay={0.6} />
        </>
      )}
    </Diagram>
  )
}

export function ReplicationVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<Mode>((visual.props?.mode as Mode) ?? 'master-slave')
  const steps = visual.stepsByMode?.[mode] ?? []
  const stepper = useStepper(steps.length)
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      header={
        <ModeToggle
          label="Replication topology"
          value={mode}
          onChange={(m) => (setMode(m), stepper.reset())}
          options={[
            { value: 'master-slave', label: 'Master-slave' },
            { value: 'master-master', label: 'Master-master' },
          ]}
        />
      }
    >
      {mode === 'master-slave' ? <MasterSlave step={stepper.step} /> : <MasterMaster step={stepper.step} />}
    </ProcessPlayer>
  )
}
