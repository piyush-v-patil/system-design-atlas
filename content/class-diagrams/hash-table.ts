import type { ClassDiagram } from './types.ts'

const d: ClassDiagram = {
  oodId: 'hash-table',
  associations: [{ from: 'HashTable', attr: 'table', to: 'Item', many: true }],
}
export default d
