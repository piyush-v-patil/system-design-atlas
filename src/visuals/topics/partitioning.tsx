import { useState } from 'react'
import type { VisualProps } from '../registry.tsx'
import { Badge, Caption, curve, Diagram, line, Node, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'

type P = [number, number]

/* ------------------------------------------------------------------ federation */

const FN = [
  { key: 'forums', label: 'Forums', color: 'var(--area-communication)', short: 'F' },
  { key: 'users', label: 'Users', color: 'var(--area-fundamentals)', short: 'U' },
  { key: 'products', label: 'Products', color: 'var(--area-data)', short: 'P' },
] as const

function FederationDiagram({ step }: { step: number }) {
  const APP: P = [78, 130]
  const federated = step >= 2
  const ys = [48, 130, 212]
  const mono = line([130, 130], [318, 130])
  const to = (i: number) => line([130, 130 + (i - 1) * 10], [346, ys[i]])
  return (
    <Diagram width={560} height={260} title={federated ? 'Federation: three databases split by function' : 'A single monolithic database serving every function'}>
      <Node x={APP[0]} y={APP[1]} kind="app" label="App" sub={step >= 6 ? 'picks the DB' : undefined} w={100} state={step === 6 ? 'active' : 'normal'} />
      {!federated ? (
        <>
          <Wire d={mono} state={step === 1 ? 'active' : 'idle'} />
          <Node x={396} y={130} kind="db" label="One database" sub="forums + users + products" w={156} h={78} state={step === 1 ? 'warn' : 'normal'} />
          {step === 1 && <Badge x={396} y={78} text="all reads + writes · one master" tone="warn" />}
          {step === 1 && FN.map((f, i) => <Packet key={f.key} path={mono} to={[318, 130]} label={f.short} color={f.color} delay={i * 0.35} />)}
        </>
      ) : (
        <>
          {FN.map((f, i) => (
            <Wire key={f.key} d={to(i)} state={step === 6 ? 'active' : 'idle'} />
          ))}
          {step === 7 && <Wire d={curve([470, 62], [470, 118], -40)} state="bad" arrow="both" dashed label="server link" labelAt={[508, 92]} />}
          {FN.map((f, i) => (
            <g key={f.key}>
              <Node x={400} y={ys[i]} kind="db" label={`${f.label} DB`} w={124} h={54} state={step === 7 && i < 2 ? 'warn' : 'normal'} />
              <rect x={338} y={ys[i] - 21} width={4} height={42} rx={2} fill={f.color} />
              {step === 3 && <Badge x={400} y={ys[i] - 32} text="less traffic · less lag" tone="ok" />}
              {step === 4 && <Badge x={400} y={ys[i] - 32} text="fits in memory · cache hits" tone="ok" />}
            </g>
          ))}
          {step >= 2 && step <= 5 &&
            FN.map((f, i) => (
              <Packet key={`${step}-${f.key}`} path={to(i)} to={[346, ys[i]]} label={step === 5 ? 'W' : f.short} color={f.color} delay={step === 5 ? 0 : i * 0.3} />
            ))}
          {step === 5 && <Caption x={240} y={248} tone="ok">no central master: writes in parallel</Caption>}
          {step === 6 && (
            <g transform="translate(20,176)">
              <rect width={146} height={62} rx={8} fill="var(--surface)" stroke="var(--border)" />
              {FN.map((f, i) => (
                <text key={f.key} x={10} y={18 + i * 16} fontSize={10}>
                  <tspan fontWeight={600} style={{ fill: f.color }}>
                    {f.label}
                  </tspan>{' '}
                  → {f.label} DB
                </text>
              ))}
            </g>
          )}
          {step === 7 && <Caption x={240} y={248} tone="bad">join users + forums across databases</Caption>}
        </>
      )}
    </Diagram>
  )
}

export function FederationVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const stepper = useStepper(steps.length)
  return (
    <ProcessPlayer steps={steps} stepper={stepper}>
      <FederationDiagram step={stepper.step} />
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ sharding */

type ShardBy = 'initial' | 'geo'
/** Illustrative sample data (not from the Primer). */
const USERS: { name: string; region: 'Americas' | 'Europe' | 'APAC'; sub?: 'North' | 'South'; power?: boolean }[] = [
  { name: 'Adams', region: 'Americas', sub: 'North', power: true },
  { name: 'Baker', region: 'Europe', power: true },
  { name: 'Chen', region: 'APAC' },
  { name: 'Diaz', region: 'Americas', sub: 'South', power: true },
  { name: 'Evans', region: 'Europe' },
  { name: 'Garcia', region: 'Americas', sub: 'South' },
  { name: 'Ito', region: 'APAC' },
  { name: 'Jones', region: 'Europe' },
  { name: 'Kim', region: 'APAC' },
  { name: 'Lopez', region: 'Americas', sub: 'South' },
  { name: 'Novak', region: 'Europe' },
  { name: 'Patel', region: 'APAC' },
  { name: 'Smith', region: 'Americas', sub: 'North' },
  { name: 'Tanaka', region: 'APAC' },
  { name: 'Young', region: 'Americas', sub: 'North' },
]

interface ShardSpec {
  label: string
  test: (u: (typeof USERS)[number]) => boolean
}
const byInitial = (ranges: [string, string][]): ShardSpec[] =>
  ranges.map(([a, b]) => ({ label: `${a}–${b}`, test: (u) => u.name[0] >= a && u.name[0] <= b }))
const SHARDS: Record<ShardBy, [ShardSpec[], ShardSpec[]]> = {
  initial: [
    byInitial([
      ['A', 'H'],
      ['I', 'P'],
      ['Q', 'Z'],
    ]),
    byInitial([
      ['A', 'F'],
      ['G', 'L'],
      ['M', 'R'],
      ['S', 'Z'],
    ]),
  ],
  geo: [
    [
      { label: 'Americas', test: (u) => u.region === 'Americas' },
      { label: 'Europe', test: (u) => u.region === 'Europe' },
      { label: 'Asia-Pacific', test: (u) => u.region === 'APAC' },
    ],
    [
      { label: 'North America', test: (u) => u.region === 'Americas' && u.sub === 'North' },
      { label: 'Europe', test: (u) => u.region === 'Europe' },
      { label: 'Asia-Pacific', test: (u) => u.region === 'APAC' },
      { label: 'South America', test: (u) => u.region === 'Americas' && u.sub === 'South' },
    ],
  ],
}

function shardOf(specs: ShardSpec[], u: (typeof USERS)[number]) {
  return specs.findIndex((s) => s.test(u))
}

/** Users that land on a different shard id after adding a shard (shard ids keep their position). */
export function movedUsers(by: ShardBy): string[] {
  const [before, after] = SHARDS[by]
  return USERS.filter((u) => shardOf(before, u) !== shardOf(after, u)).map((u) => u.name)
}

function ShardingDiagram({ by, step }: { by: ShardBy; step: number }) {
  const grown = step >= 6
  const specs = SHARDS[by][grown ? 1 : 0]
  const n = specs.length
  const ys = n === 3 ? [52, 140, 228] : [40, 106, 172, 238]
  const moved = new Set(grown ? movedUsers(by) : [])
  const R: P = [84, 140]
  const lookup = USERS.find((u) => u.name === 'Lopez')!
  const target = shardOf(specs, lookup)
  return (
    <Diagram width={560} height={280} title={`Sharding a users table by ${by === 'initial' ? 'last name initial' : 'geographic location'} across ${n} shards`}>
      {ys.map((y, i) => (
        <Wire key={i} d={line([136, R[1] + (i - (n - 1) / 2) * 8], [234, y])} state={step === 2 && i === target ? 'active' : step === 4 && i === 1 ? 'broken' : 'idle'} />
      ))}
      {step === 7 && <Wire d={curve([350, ys[0] + 14], [350, ys[2] - 14], 46)} state="bad" arrow="both" dashed label="cross-shard join" labelAt={[312, ys[1] - 26]} />}
      <Node x={R[0]} y={R[1]} kind="app" label="App logic" sub={by === 'initial' ? 'shard by initial' : 'shard by region'} w={112} state={step === 2 ? 'active' : 'normal'} />
      {specs.map((spec, i) => {
        const members = USERS.filter((u) => spec.test(u))
        const hot = step === 5 && members.filter((u) => u.power).length >= 2
        const down = step === 4 && i === 1
        return (
          <g key={spec.label}>
            <Node
              x={290}
              y={ys[i]}
              kind="db"
              label={`Shard ${i + 1}`}
              sub={spec.label}
              w={112}
              h={n === 3 ? 54 : 50}
              state={down ? 'down' : hot ? 'warn' : grown && i === n - 1 && step === 6 ? 'active' : 'normal'}
            />
            {step === 3 && <Badge x={290} y={ys[i] - 30} text="smaller index" tone="ok" />}
            {step === 4 && !down && <Badge x={290} y={ys[i] - 28} text="still operational" tone="ok" />}
            {hot && <Badge x={290} y={ys[i] - 30} text="hot shard: power users" tone="warn" />}
            {members.map((u, k) => {
              const col = k % 3
              const row = Math.floor(k / 3)
              const x = 356 + col * 66
              const y = ys[i] - 18 + row * 19
              const isMoved = moved.has(u.name)
              return (
                <g key={u.name} opacity={down ? 0.35 : 1}>
                  <rect x={x} y={y} width={62} height={16} rx={8} fill={isMoved ? 'var(--accent-soft)' : 'var(--surface)'} stroke={isMoved ? 'var(--accent)' : 'var(--border)'} strokeWidth={isMoved ? 1.6 : 1} />
                  <text x={x + 31} y={y + 11.5} fontSize={9.5} textAnchor="middle" fontWeight={u.power && step === 5 ? 700 : 400}>
                    {u.power && step === 5 ? '★ ' : ''}
                    {u.name}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
      {step === 2 && <Packet key={`l${by}`} path={line([136, R[1]], [234, ys[target]])} to={[234, ys[target]]} label="L" />}
      {step === 2 && (
        <Caption x={R[0]} y={R[1] + 44} tone="muted">
          {by === 'initial' ? '“Lopez” → L' : 'Lopez → Americas'}
        </Caption>
      )}
      {step === 6 && (
        <Caption x={R[0]} y={R[1] + 44} tone="warn">
          {moved.size} of {USERS.length} users move
        </Caption>
      )}
    </Diagram>
  )
}

export function ShardingVisual({ visual }: VisualProps) {
  const [by, setBy] = useState<ShardBy>('initial')
  const steps = visual.steps ?? []
  const stepper = useStepper(steps.length)
  return (
    <ProcessPlayer
      steps={steps}
      stepper={stepper}
      header={
        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle
            label="Shard key"
            value={by}
            onChange={setBy}
            options={[
              { value: 'initial', label: 'By last name initial' },
              { value: 'geo', label: 'By geographic location' },
            ]}
          />
          <span className="text-[11px] text-muted">Sample users are illustrative.</span>
        </div>
      }
    >
      <ShardingDiagram by={by} step={stepper.step} />
    </ProcessPlayer>
  )
}
