import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Caption, Diagram, line, Node, Packet, Wire, type WireState } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'

type Mode = 'weak' | 'eventual' | 'strong'
type P = [number, number]
const W: P = [80, 64]
const N1: P = [262, 64]
const N2: P = [462, 64]
const N3: P = [462, 196]
const R: P = [262, 196]
const S = {
  wn1: [[132, 64], [210, 64]] as [P, P],
  n1n2: [[314, 64], [410, 64]] as [P, P],
  n1n3: [[300, 90], [420, 172]] as [P, P],
  rn3: [[314, 196], [410, 196]] as [P, P],
}
const back = ([a, b]: [P, P]): [P, P] => [b, a]

interface Frame {
  vals: [number, number, number]
  wires?: Partial<Record<keyof typeof S, WireState>>
  packets?: { seg: [P, P]; label: string; tone?: 'accent' | 'ok' | 'bad' | 'warn'; delay?: number }[]
  readerSees?: { text: string; tone: 'ok' | 'warn' | 'bad' }
  writer?: { text: string; tone: 'ok' | 'warn' | 'accent' }
  note?: { text: string; tone: 'ok' | 'bad' | 'warn' | 'muted' }
}

function frames(mode: Mode): Frame[] {
  const start: Frame = { vals: [1, 1, 1] }
  if (mode === 'weak')
    return [
      start,
      { vals: [2, 1, 1], wires: { wn1: 'active' }, packets: [{ seg: S.wn1, label: 'x=2' }] },
      { vals: [2, 2, 1], wires: { n1n2: 'active', n1n3: 'broken' }, packets: [{ seg: S.n1n2, label: 'x=2' }], note: { text: 'best effort: N3 never gets it', tone: 'warn' } },
      { vals: [2, 2, 1], wires: { rn3: 'active', n1n3: 'broken' }, packets: [{ seg: S.rn3, label: 'get' }, { seg: back(S.rn3), label: 'x=1', tone: 'warn', delay: 1 }], readerSees: { text: 'sees x = 1', tone: 'warn' } },
    ]
  if (mode === 'eventual')
    return [
      start,
      { vals: [2, 1, 1], wires: { wn1: 'active' }, packets: [{ seg: S.wn1, label: 'x=2' }, { seg: back(S.wn1), label: 'ok', tone: 'ok', delay: 1 }], writer: { text: 'acknowledged', tone: 'ok' } },
      { vals: [2, 1, 1], wires: { rn3: 'active' }, packets: [{ seg: S.rn3, label: 'get' }, { seg: back(S.rn3), label: 'x=1', tone: 'warn', delay: 1 }], readerSees: { text: 'sees x = 1 (not yet)', tone: 'warn' } },
      { vals: [2, 2, 2], wires: { n1n2: 'active', n1n3: 'active' }, packets: [{ seg: S.n1n2, label: 'x=2' }, { seg: S.n1n3, label: 'x=2', delay: 0.3 }], note: { text: 'replicated asynchronously', tone: 'muted' } },
      { vals: [2, 2, 2], wires: { rn3: 'ok' }, packets: [{ seg: S.rn3, label: 'get' }, { seg: back(S.rn3), label: 'x=2', tone: 'ok', delay: 1 }], readerSees: { text: 'sees x = 2', tone: 'ok' } },
    ]
  return [
    start,
    { vals: [2, 1, 1], wires: { wn1: 'active' }, packets: [{ seg: S.wn1, label: 'x=2' }], writer: { text: 'waiting…', tone: 'warn' } },
    { vals: [2, 2, 2], wires: { n1n2: 'active', n1n3: 'active' }, packets: [{ seg: S.n1n2, label: 'x=2' }, { seg: S.n1n3, label: 'x=2' }], writer: { text: 'waiting…', tone: 'warn' }, note: { text: 'replicated synchronously', tone: 'muted' } },
    { vals: [2, 2, 2], wires: { wn1: 'ok' }, packets: [{ seg: back(S.wn1), label: 'ok', tone: 'ok' }], writer: { text: 'acknowledged', tone: 'ok' } },
    { vals: [2, 2, 2], wires: { rn3: 'ok' }, packets: [{ seg: S.rn3, label: 'get' }, { seg: back(S.rn3), label: 'x=2', tone: 'ok', delay: 1 }], readerSees: { text: 'sees x = 2', tone: 'ok' } },
  ]
}

function ConsistencyDiagram({ mode, step }: { mode: Mode; step: number }) {
  const f = frames(mode)[step] ?? frames(mode)[0]
  const w = f.wires ?? {}
  const nodes: [P, string][] = [
    [N1, 'Copy N1'],
    [N2, 'Copy N2'],
    [N3, 'Copy N3'],
  ]
  return (
    <Diagram width={560} height={250} title={`${mode} consistency: a write followed by a read from another copy`}>
      {(Object.keys(S) as (keyof typeof S)[]).map((k) => (
        <Wire key={k} d={line(...S[k])} state={w[k] ?? 'idle'} arrow="none" />
      ))}
      <Node x={W[0]} y={W[1]} kind="client" label="Writer" w={98} />
      <Node x={R[0]} y={R[1]} kind="client" label="Reader" w={98} />
      {nodes.map(([p, label], i) => (
        <g key={label}>
          <Node x={p[0]} y={p[1]} kind="db" label={label} w={100} h={54} state={f.vals[i] === 2 ? 'active' : 'normal'} />
          <Badge x={p[0]} y={p[1] + (i === 2 ? 42 : -36)} text={`x = ${f.vals[i]}`} tone={f.vals[i] === 2 ? 'accent' : 'ok'} />
        </g>
      ))}
      {f.writer && <Badge x={W[0]} y={W[1] + 40} text={f.writer.text} tone={f.writer.tone} />}
      {f.readerSees && <Badge x={R[0]} y={R[1] + 42} text={f.readerSees.text} tone={f.readerSees.tone} />}
      {f.note && (
        <Caption x={372} y={126} tone={f.note.tone}>
          {f.note.text}
        </Caption>
      )}
      {f.packets?.map((pk, i) => <Packet key={`${mode}-${step}-${i}`} path={line(...pk.seg)} to={pk.seg[1]} label={pk.label} tone={pk.tone} delay={pk.delay} />)}
    </Diagram>
  )
}

export function ConsistencyVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<Mode>((visual.props?.mode as Mode) ?? 'eventual')
  const steps = visual.stepsByMode?.[mode] ?? []
  const stepper = useStepper(steps.length)
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      header={
        <ModeToggle
          label="Consistency pattern"
          value={mode}
          onChange={(m) => (setMode(m), stepper.reset())}
          options={[
            { value: 'weak', label: 'Weak' },
            { value: 'eventual', label: 'Eventual' },
            { value: 'strong', label: 'Strong' },
          ]}
        />
      }
    >
      <ConsistencyDiagram mode={mode} step={stepper.step} />
    </ProcessPlayer>
  )
}
