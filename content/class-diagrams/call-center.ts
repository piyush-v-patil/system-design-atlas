import type { ClassDiagram } from './types.ts'

const d: ClassDiagram = {
  oodId: 'call-center',
  associations: [
    { from: 'CallCenter', attr: 'operators', to: 'Operator', many: true },
    { from: 'CallCenter', attr: 'supervisors', to: 'Supervisor', many: true },
    { from: 'CallCenter', attr: 'directors', to: 'Director', many: true },
    { from: 'CallCenter', attr: 'queued_calls', to: 'Call', many: true },
    { from: 'Employee', attr: 'rank', to: 'Rank' },
    { from: 'Employee', attr: 'call', to: 'Call' },
    { from: 'Call', attr: 'state', to: 'CallState' },
  ],
  notes: [
    'Supervisor and Director call super(Operator, self).__init__(…) rather than naming their own class, and no subclass passes the call_center argument that Employee.__init__ takes. The .py module has the same code.',
  ],
}
export default d
