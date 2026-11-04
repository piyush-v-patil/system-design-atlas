import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { VisualProps } from '../registry.tsx'
import { topics } from '../../lib/content.ts'
import { bullets, bulletsAfter, table } from '../auto.ts'
import { Badge, Caption, Diagram, line, Packet, Wire } from '../kit/svg.tsx'
import { ModeToggle, ProcessPlayer, useStepper } from '../kit/Stepper.tsx'
import { LineRef } from '../kit/Claims.tsx'
import { q } from '../../../content/visuals/types.ts'
import { plain } from '../../lib/quote.ts'

/* ------------------------------------------------------------------ OSI model (as drawn in the Primer's image) */

const OSI: { n: number; name: string; example: string; links: string[] }[] = [
  { n: 7, name: 'Application', example: 'End user layer · SMTP', links: ['hypertext-transfer-protocol-http', 'representational-state-transfer-rest', 'layer-7-load-balancing'] },
  { n: 6, name: 'Presentation', example: 'Syntax layer · JPEG, ASCII', links: [] },
  { n: 5, name: 'Session', example: 'Synch & send to ports · RPC, SQL, NFS', links: ['remote-procedure-call-rpc'] },
  { n: 4, name: 'Transport', example: 'TCP · host to host, flow control · TCP, SPX, UDP', links: ['transmission-control-protocol-tcp', 'user-datagram-protocol-udp', 'layer-4-load-balancing'] },
  { n: 3, name: 'Network', example: 'Packets (contain IP address) · routers · IP', links: [] },
  { n: 2, name: 'Data Link', example: 'Frames (contain MAC address) · switch, bridge', links: [] },
  { n: 1, name: 'Physical', example: 'Physical structure · cables, hubs', links: [] },
]

export function OsiVisual(_: VisualProps) {
  const [sel, setSel] = useState(7)
  const layer = OSI.find((l) => l.n === sel)!
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:p-4">
      <ol className="flex flex-col gap-1" aria-label="OSI layers">
        {OSI.map((l) => {
          const hot = l.links.length > 0
          return (
            <li key={l.n}>
              <button
                onClick={() => setSel(l.n)}
                aria-pressed={sel === l.n}
                className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${sel === l.n ? 'border-[var(--accent)] bg-accent-soft' : 'border-line hover:bg-surface-2'}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold text-white" style={{ background: `hsl(${(7 - l.n) * 22} 60% ${hot ? 46 : 62}%)` }}>
                  {l.n}
                </span>
                <span className="font-medium">{l.name}</span>
                {hot && <span className="ml-auto rounded-full bg-surface-2 px-1.5 text-[10px] text-muted">covered</span>}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-col gap-2 rounded-lg bg-surface-2/60 p-3 text-sm">
        <div className="text-xs font-semibold text-muted">Layer {layer.n}</div>
        <div className="text-lg font-semibold">{layer.name}</div>
        <div className="text-muted">{layer.example}</div>
        {layer.links.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {layer.links.map((id) => (
              <Link key={id} to={`/topic/${id}`} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs hover:border-[var(--accent)]">
                {topics.nodes[id].title}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted">Not covered further here.</div>
        )}
        <p className="mt-auto text-[11px] text-muted">Layer names and examples: OSI 7 layer model.</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ HTTP verbs (parsed from the Primer's table) */

export function HttpVerbsVisual({ node }: VisualProps) {
  const t = table(topics.nodes[node.id])
  const [verb, setVerb] = useState(0)
  if (!t) return null
  const row = t.rows[verb]
  const [name, desc, idem, safe, cache] = row.cells
  const yes = (v: string) => v.startsWith('Yes')
  const prop = (label: string, v: string) => (
    <div className={`rounded-lg border px-2.5 py-2 ${yes(v) ? 'border-[var(--ok)]/50 bg-[var(--ok-soft)]' : 'border-line'}`}>
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-sm font-semibold ${yes(v) ? 'text-ok' : ''}`}>{v}</div>
    </div>
  )
  const footnote = topics.nodes[node.id].markdown.split('\n').findIndex((l) => l.startsWith('*Can be called'))
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="HTTP verb">
        {t.rows.map((r, i) => (
          <button key={r.line} role="tab" aria-selected={verb === i} onClick={() => setVerb(i)} className={`rounded-lg border px-3 py-1 font-mono text-sm font-bold ${verb === i ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-line hover:bg-surface-2'}`}>
            {r.cells[0]}
          </button>
        ))}
      </div>
      <Diagram width={560} height={120} title={`HTTP ${name} request and response`}>
        <rect x={20} y={36} width={110} height={48} rx={8} fill="var(--node-fill)" stroke="var(--node-stroke)" />
        <text x={75} y={65} fontSize={12} fontWeight={600} textAnchor="middle">
          Client
        </text>
        <rect x={430} y={36} width={110} height={48} rx={8} fill="var(--node-fill)" stroke="var(--node-stroke)" />
        <text x={485} y={65} fontSize={12} fontWeight={600} textAnchor="middle">
          Server
        </text>
        <Wire d={line([130, 50], [430, 50])} state="active" label={`${name} /resource`} labelAt={[280, 42]} />
        <Wire d={line([430, 74], [130, 74])} state="ok" label="status + content" labelAt={[280, 92]} />
        <Packet key={`v${verb}`} path={line([130, 50], [430, 50])} to={[430, 50]} label={name.slice(0, 3)} />
        <Packet key={`r${verb}`} path={line([430, 74], [130, 74])} to={[130, 74]} label="200" tone="ok" delay={1} />
      </Diagram>
      <p className="text-sm">
        <span className="font-mono font-bold">{name}</span> · {desc}
        <LineRef claim={q(row.cells.join(' '), row.line)} />
      </p>
      <div className="grid grid-cols-3 gap-2">
        {prop(plain(t.header[2]), idem)}
        {prop(t.header[3], safe)}
        {prop(t.header[4], cache)}
      </div>
      {footnote >= 0 && (
        <p className="text-xs text-muted">
          {topics.nodes[node.id].markdown.split('\n')[footnote].replace(/^\*/, '* ')}
          <LineRef claim={q('Can be called many times without different outcomes.', topics.nodes[node.id].sourceLines[0] + footnote)} />
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ TCP vs UDP */

type Proto = 'tcp' | 'udp'
export function TcpUdpVisual({ visual }: VisualProps) {
  const [mode, setMode] = useState<Proto>((visual.props?.mode as Proto) ?? 'tcp')
  const steps = visual.stepsByMode?.[mode] ?? []
  const s = useStepper(steps.length, 3200)
  const st = s.step
  const L = 110
  const R = 450
  const lane = (y: number) => line([L + 50, y], [R - 50, y])
  const tcpUse = bulletsAfter(topics.nodes['transmission-control-protocol-tcp'], 'Use TCP over UDP when:')
  const udpUse = bulletsAfter(topics.nodes['user-datagram-protocol-udp'], 'Use UDP over TCP when:')
  const received = mode === 'tcp' ? (st >= 4 ? '1 2 3 4' : st === 3 ? '1 2 _ 4 → resend 3' : st === 2 ? '1 2 _ 4' : '') : st >= 3 ? '1 4 3' : st === 2 ? '1 …' : ''
  return (
    <ProcessPlayer
      steps={steps}
      stepper={s}
      header={
        <ModeToggle
          label="Protocol"
          value={mode}
          onChange={(m) => (setMode(m), s.reset())}
          options={[
            { value: 'tcp', label: 'TCP (connection-oriented)' },
            { value: 'udp', label: 'UDP (connectionless)' },
          ]}
        />
      }
      aside={
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          {[
            ['Use TCP over UDP when', tcpUse],
            ['Use UDP over TCP when', udpUse],
          ].map(([title, list]) => (
            <div key={title as string} className="rounded-lg border border-line p-2">
              <div className="mb-1 font-semibold">{title as string}</div>
              <ul className="flex flex-col gap-0.5">
                {(list as typeof tcpUse).map((b, i) => (
                  <li key={i}>
                    · {b.claim.text}
                    <LineRef claim={b.claim} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      }
    >
      <Diagram width={560} height={240} title={`${mode.toUpperCase()}: how packets travel from sender to receiver`}>
        {[L, R].map((x, i) => (
          <g key={x}>
            <rect x={x - 50} y={30} width={100} height={170} rx={10} fill="var(--node-fill)" stroke="var(--node-stroke)" />
            <text x={x} y={50} fontSize={12} fontWeight={600} textAnchor="middle">
              {i ? 'Receiver' : 'Sender'}
            </text>
          </g>
        ))}
        {mode === 'tcp' && st === 1 && (
          <>
            <Wire d={lane(80)} state="active" arrow="both" label="handshake" labelAt={[280, 72]} />
            <Packet key="h1" path={lane(80)} to={[R - 50, 80]} label="hi" />
            <Packet key="h2" path={line([R - 50, 80], [L + 50, 80])} to={[L + 50, 80]} label="hi" tone="ok" delay={0.9} />
            <Packet key="h3" path={lane(80)} to={[R - 50, 80]} label="ok" delay={1.8} />
          </>
        )}
        {st >= 2 &&
          [1, 2, 3, 4].map((n, i) => {
            const y = 82 + i * 28
            const lost = n === 3
            const late = mode === 'udp' && n === 3
            if (mode === 'udp' && n === 2 && st >= 2) {
              return (
                <g key={n}>
                  <Wire d={line([L + 50, y], [280, y])} state="bad" arrow="none" dashed />
                  {st === 2 && <Packet key={`u${n}`} path={line([L + 50, y], [280, y])} to={[280, y]} label="2" tone="bad" delay={i * 0.25} />}
                  <Caption x={290} y={y + 4} anchor="start" tone="bad">
                    lost: not resent
                  </Caption>
                </g>
              )
            }
            if (mode === 'tcp' && lost && st >= 2) {
              return (
                <g key={n}>
                  <Wire d={st >= 3 ? lane(y) : line([L + 50, y], [280, y])} state={st >= 3 ? 'ok' : 'bad'} arrow={st >= 3 ? 'end' : 'none'} dashed={st < 3} />
                  {st === 2 && <Packet key={`t${n}`} path={line([L + 50, y], [280, y])} to={[280, y]} label="3" tone="bad" delay={i * 0.25} />}
                  {st === 2 && <Caption x={290} y={y + 4} anchor="start" tone="bad">no ACK for 3…</Caption>}
                  {st === 3 && <Packet key="re3" path={lane(y)} to={[R - 50, y]} label="3" tone="ok" delay={0.3} />}
                </g>
              )
            }
            return (
              <g key={n}>
                <Wire d={lane(y)} state={late ? 'active' : 'idle'} />
                {st === 2 && <Packet key={`${mode}${n}`} path={lane(y)} to={[R - 50, y]} label={String(n)} delay={late ? 1.4 : i * 0.25} />}
                {mode === 'tcp' && st === 2 && <Packet key={`ack${n}`} path={line([R - 50, y + 6], [L + 50, y + 6])} to={[L + 50, y + 6]} label="✓" tone="ok" delay={1 + i * 0.25} />}
              </g>
            )
          })}
        {received && (
          <g transform={`translate(${R},212)`}>
            <text fontSize={11} textAnchor="middle" fontWeight={600} style={{ fill: mode === 'udp' && st >= 3 ? 'var(--warn)' : 'var(--text)' }}>
              got: {received}
            </text>
          </g>
        )}
        {mode === 'tcp' && st >= 2 && <Badge x={L} y={214} text="seq # + checksum" tone="accent" />}
        {mode === 'udp' && st === 1 && <Caption x={280} y={120} tone="muted">no connection set-up: just send</Caption>}
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ RPC (the Primer's client/server process diagram) */

export function RpcVisual({ visual }: VisualProps) {
  const steps = visual.steps ?? []
  const s = useStepper(steps.length)
  const st = s.step
  const pill = (x: number, label: string, on: boolean) => (
    <g transform={`translate(${x},62)`}>
      <rect x={-24} width={48} height={74} rx={24} fill={on ? 'var(--accent-soft)' : 'var(--node-fill)'} stroke={on ? 'var(--accent)' : 'var(--node-stroke)'} strokeWidth={1.6} style={{ transition: 'all 250ms' }} />
      <text y={94} fontSize={10} textAnchor="middle" className={on ? undefined : 'muted'} fontWeight={on ? 700 : 400}>
        {label.split('\n').map((t, i) => (
          <tspan key={i} x={0} dy={i ? 12 : 0}>
            {t}
          </tspan>
        ))}
      </text>
    </g>
  )
  // Highlight per step: client program, client stub, client comm, server comm, server stub, (reply)
  const cx = [42, 104, 166]
  const sx = [326, 388, 450, 512]
  const on = (who: string) =>
    ({ cp: st === 1, cs: st === 2 || st === 6, cc: st === 3 || st === 6, sc: st === 4 || st === 6, ss: st === 5 || st === 6, sp: st === 5 })[who] ?? false
  return (
    <ProcessPlayer steps={steps} stepper={s}>
      <Diagram width={560} height={250} title="Remote procedure call: client program, stubs and communication modules on both sides, as in the Primer's diagram">
        <rect x={6} y={24} width={196} height={170} rx={36} fill="none" stroke="var(--border)" />
        <text x={104} y={44} fontSize={11} fontWeight={700} textAnchor="middle">
          client process
        </text>
        <rect x={292} y={24} width={262} height={170} rx={36} fill="none" stroke="var(--border)" />
        <text x={420} y={44} fontSize={11} fontWeight={700} textAnchor="middle">
          server process
        </text>
        {pill(cx[0], 'client\nprogram', on('cp'))}
        {pill(cx[1], 'client\nstub', on('cs'))}
        {pill(cx[2], 'comm.\nmodule', on('cc'))}
        {pill(sx[0], 'comm.\nmodule', on('sc'))}
        {pill(sx[1], 'dispatcher', st === 5)}
        {pill(sx[2], 'server\nstub', on('ss'))}
        {pill(sx[3], 'service\nprocedure', on('sp'))}
        <Wire d={line([190, 84], [302, 84])} state={st === 3 || st === 4 ? 'active' : 'idle'} label="Request" labelAt={[246, 76]} />
        <Wire d={line([302, 116], [190, 116])} state={st === 6 ? 'ok' : 'idle'} label="Reply" labelAt={[246, 132]} />
        {st === 2 && <Badge x={cx[1]} y={214} text="marshal: id + args" tone="accent" />}
        {st === 5 && <Badge x={sx[2]} y={214} text="unmarshal + call" tone="accent" />}
        {st === 3 && <Packet key="rq" path={line([190, 84], [302, 84])} to={[302, 84]} label="msg" />}
        {st === 6 && <Packet key="rp" path={line([302, 116], [190, 116])} to={[190, 116]} label="res" tone="ok" />}
      </Diagram>
    </ProcessPlayer>
  )
}

/* ------------------------------------------------------------------ REST: one URI, different verbs */

export function RestVisual({ node }: VisualProps) {
  const qualities = bullets(topics.nodes[node.id]).filter((b) => /^\*\*/.test(b.md))
  const verbs = [
    { v: 'GET', note: 'read a representation', tone: 'ok' as const },
    { v: 'PUT', note: 'replace it', tone: 'accent' as const },
    { v: 'DELETE', note: 'remove it', tone: 'bad' as const },
  ]
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <Diagram width={560} height={170} title="REST: the same resource URI, with the HTTP verb choosing the action">
        <rect x={340} y={50} width={200} height={70} rx={10} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.6} />
        <text x={440} y={78} fontSize={13} fontWeight={700} textAnchor="middle" style={{ fontFamily: 'ui-monospace, monospace' }}>
          /persons/1234
        </text>
        <text x={440} y={98} fontSize={10} textAnchor="middle" className="muted">
          one resource, one URI
        </text>
        {verbs.map((v, i) => {
          const y = 40 + i * 45
          return (
            <g key={v.v} style={{ animation: `fade-up 300ms ease-out ${i * 120}ms both` }}>
              <rect x={20} y={y - 14} width={86} height={28} rx={14} fill="var(--node-fill)" stroke="var(--node-stroke)" />
              <text x={63} y={y + 4} fontSize={12} fontWeight={700} textAnchor="middle" style={{ fontFamily: 'ui-monospace, monospace' }}>
                {v.v}
              </text>
              <Wire d={line([106, y], [338, 85])} state="active" label={v.note} labelAt={[210, y - 6]} />
            </g>
          )
        })}
        <Caption x={440} y={150} tone="muted">
          sample calls
        </Caption>
      </Diagram>
      <ul className="grid gap-2 sm:grid-cols-2">
        {qualities.map((b, i) => {
          const [term, ...rest] = b.claim.text.split(' - ')
          return (
            <li key={i} className="rounded-lg border border-line px-3 py-2 text-sm">
              <div className="font-semibold">{term}</div>
              <div className="text-xs text-muted">
                {rest.join(' - ')}
                <LineRef claim={b.claim} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ RPC vs REST calls (the Primer's table) */

export function RpcRestTableVisual({ node }: VisualProps) {
  const t = table(topics.nodes[node.id])
  const [i, setI] = useState(0)
  if (!t) return null
  const row = t.rows[i]
  const fmt = (cell: string) =>
    cell
      .replace(/<br\/>/g, '\n')
      .replace(/\*\*/g, '')
      .trim()
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Operation">
        {t.rows.map((r, j) => (
          <button key={r.line} role="tab" aria-selected={i === j} onClick={() => setI(j)} className={`rounded-full border px-2.5 py-1 text-xs ${i === j ? 'border-[var(--accent)] bg-accent-soft font-semibold' : 'border-line hover:bg-surface-2'}`}>
            {r.cells[0]}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[1, 2].map((c) => (
          <div key={`${c}-${i}`} className="rounded-lg border border-line" style={{ animation: 'fade-up 250ms ease-out both' }}>
            <div className="border-b border-line px-3 py-1.5 text-xs font-semibold">{t.header[c]}</div>
            <pre className="m-0 overflow-x-auto px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap">
              <code>{fmt(row.cells[c])}</code>
            </pre>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        The same operation in both styles.
        <LineRef claim={q(row.cells.join(' '), row.line)} />
      </p>
    </div>
  )
}
