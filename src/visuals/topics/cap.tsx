import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Caption, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'

type Mode = 'CP' | 'AP'
type P = [number, number]
const W: P = [86, 66]
const R: P = [86, 194]
const N1: P = [300, 66]
const N2: P = [300, 194]
const WN1: [P, P] = [[138, 66], [248, 66]]
const RN2: [P, P] = [[138, 194], [248, 194]]
const LINK: [P, P] = [[300, 94], [300, 166]]
const back = ([a, b]: [P, P]): [P, P] => [b, a]

function CapDiagram({ mode, step }: { mode: Mode; step: number }) {
  const partitioned = step >= 1 && !(mode === 'AP' && step >= 5)
  const n1 = step >= 2 ? 'x = 2' : 'x = 1'
  const n2 = mode === 'AP' && step >= 5 ? 'x = 2' : 'x = 1'
  return (
    <Diagram width={560} height={250} title={`CAP theorem: a ${mode} system during a network partition`}>
      <Wire d={line(...WN1)} state={step === 2 ? 'active' : 'idle'} />
      <Wire d={line(...RN2)} state={step === 3 ? 'active' : 'idle'} />
      <Wire d={line(...LINK)} state={partitioned ? 'broken' : mode === 'AP' && step === 5 ? 'ok' : 'idle'} arrow="both" />
      {partitioned && (
        <g transform={`translate(${LINK[0][0]},130)`}>
          <path d="M-22 -8l10 8-8 4 8 6" stroke="var(--bad)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Caption x={14} y={4} anchor="start" tone="bad">partition</Caption>
        </g>
      )}
      <Node x={W[0]} y={W[1]} kind="client" label="Writer" w={100} />
      <Node x={R[0]} y={R[1]} kind="client" label="Reader" w={100} />
      <Node x={N1[0]} y={N1[1]} kind="server" label="Node N1" w={104} state={step === 2 ? 'active' : 'normal'} />
      <Node
        x={N2[0]}
        y={N2[1]}
        kind="server"
        label="Node N2"
        w={104}
        state={mode === 'CP' && step === 3 ? 'warn' : mode === 'AP' && step === 3 ? 'warn' : 'normal'}
      />
      <Badge x={N1[0]} y={N1[1] - 34} text={n1} tone={step >= 2 ? 'accent' : 'ok'} />
      <Badge x={N2[0]} y={N2[1] + 40} text={n2} tone={n2 === n1 ? 'ok' : 'warn'} />
      {step === 2 && <Caption x={318} y={118} anchor="start" tone="bad">can’t replicate</Caption>}

      {/* Outcome panel */}
      <g transform="translate(392,40)">
        <rect width={156} height={170} rx={10} fill="var(--surface)" stroke="var(--border)" />
        <text x={12} y={22} fontSize={11} fontWeight={700}>
          {mode === 'CP' ? 'CP: consistency first' : 'AP: availability first'}
        </text>
        {step >= 3 && (
          <>
            <text x={12} y={48} fontSize={10.5} className="muted">Read from N2 returns:</text>
            <text x={12} y={68} fontSize={14} fontWeight={700} style={{ fill: mode === 'CP' ? 'var(--bad)' : 'var(--warn)' }}>
              {mode === 'CP' ? 'timeout error' : 'x = 1 (stale)'}
            </text>
          </>
        )}
        {step >= 4 && (
          <text x={12} y={96} fontSize={10.5} style={{ fill: 'var(--ok)', fontWeight: 600 }}>
            {mode === 'CP' ? '✓ never a stale read' : '✓ every request answered'}
          </text>
        )}
        {step >= 4 && (
          <text x={12} y={114} fontSize={10.5} style={{ fill: 'var(--bad)', fontWeight: 600 }}>
            {mode === 'CP' ? '✕ not available' : '✕ not consistent'}
          </text>
        )}
        {step >= 5 && (
          <text x={12} y={146} fontSize={10.5} className="muted">
            {mode === 'CP' ? 'Fits atomic reads/writes' : 'Partition healed: N2 catches up'}
          </text>
        )}
      </g>

      {step === 2 && <Packet key="w" path={line(...WN1)} to={WN1[1]} label="x=2" />}
      {step === 3 && <Packet key="r" path={line(...RN2)} to={RN2[1]} label="get" />}
      {step === 3 && (
        <Packet key="rr" path={line(...back(RN2))} to={RN2[0]} label={mode === 'CP' ? '✕' : 'x=1'} tone={mode === 'CP' ? 'bad' : 'warn'} delay={mode === 'CP' ? 1.6 : 1} />
      )}
      {mode === 'AP' && step === 5 && <Packet key="h" path={line(...LINK)} to={LINK[1]} label="x=2" tone="ok" />}
    </Diagram>
  )
}

export function CapVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<Mode>((visual.props?.mode as Mode) ?? 'CP')
  const steps = visual.stepsByMode?.[mode] ?? []
  const stepper = useStepper(steps.length)
  const change = (m: Mode) => {
    setMode(m)
    stepper.reset()
  }
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      header={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ModeToggle
            label="Choose the trade-off"
            value={mode}
            onChange={change}
            options={[
              { value: 'CP', label: 'CP: consistency + partition tolerance' },
              { value: 'AP', label: 'AP: availability + partition tolerance' },
            ]}
          />
        </div>
      }
    >
      <CapDiagram mode={mode} step={stepper.step} />
    </ProcessPlayer>
  )
}
