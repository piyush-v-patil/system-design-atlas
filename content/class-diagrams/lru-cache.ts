import type { ClassDiagram } from './types.ts'

const d: ClassDiagram = {
  oodId: 'lru-cache',
  associations: [
    { from: 'Cache', attr: 'lookup', to: 'Node', many: true },
    { from: 'Cache', attr: 'linked_list', to: 'LinkedList' },
    { from: 'LinkedList', attr: 'head', to: 'Node' },
    { from: 'LinkedList', attr: 'tail', to: 'Node' },
  ],
  notes: ['In the notebook, def get(self, query) is missing its colon; the .py module has it.'],
}
export default d
