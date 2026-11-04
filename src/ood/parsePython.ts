/**
 * A small, line-based reader for the Primer's OOD notebooks: classes, their bases, enum members, class constants,
 * instance attributes set in __init__, and methods. Line numbers are 1-based within the code cell, so they line up
 * with the code shown next to the diagram.
 */
export interface PyMember {
  kind: 'enum' | 'const' | 'attr' | 'method'
  name: string
  /** Parameters without `self`, for methods. */
  params?: string
  line: number
  abstract?: boolean
  property?: boolean
}

export interface PyClass {
  name: string
  /** Bases as written, minus `object`. */
  bases: string[]
  metaclass?: string
  isEnum: boolean
  isAbstract: boolean
  line: number
  /** Last line of the class body (inclusive). */
  end: number
  members: PyMember[]
}

export function parsePython(code: string): PyClass[] {
  const lines = code.split('\n')
  const classes: PyClass[] = []
  let cur: PyClass | null = null
  let inInit = false
  let decorators: string[] = []
  const close = (i: number) => {
    if (!cur) return
    let end = i
    while (end > cur.line && !lines[end - 1].trim()) end--
    cur.end = end
    classes.push(cur)
    cur = null
  }
  lines.forEach((raw, idx) => {
    const n = idx + 1
    const cls = /^class\s+(\w+)\s*(?:\(([^)]*)\))?\s*:/.exec(raw)
    if (cls) {
      close(n - 1)
      const args = (cls[2] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
      const metaclass = args.find((a) => a.startsWith('metaclass='))?.slice('metaclass='.length)
      const bases = args.filter((a) => !a.startsWith('metaclass=') && a !== 'object')
      cur = { name: cls[1], bases, metaclass, isEnum: bases.includes('Enum'), isAbstract: metaclass === 'ABCMeta', line: n, end: n, members: [] }
      inInit = false
      decorators = []
      return
    }
    if (!cur) return
    if (/^\S/.test(raw) && raw.trim() && !raw.startsWith('#')) {
      close(n - 1)
      return
    }
    const deco = /^ {4}@([\w.]+)/.exec(raw)
    if (deco) {
      decorators.push(deco[1])
      return
    }
    const def = /^ {4}def\s+(\w+)\s*\(([^)]*)\)/.exec(raw)
    if (def) {
      inInit = def[1] === '__init__'
      const params = def[2].split(',').map((s) => s.trim()).filter((s) => s && s !== 'self').join(', ')
      if (!inInit) {
        const prev = cur.members.find((m) => m.kind === 'method' && m.name === def[1])
        const isProp = decorators.includes('property') || decorators.some((d) => d.endsWith('.setter'))
        if (!prev) cur.members.push({ kind: 'method', name: def[1], params, line: n, abstract: decorators.includes('abstractmethod'), property: isProp })
      }
      decorators = []
      return
    }
    const constant = /^ {4}([A-Za-z_]\w*)\s*=\s*\S/.exec(raw)
    if (constant) {
      cur.members.push({ kind: cur.isEnum ? 'enum' : 'const', name: constant[1], line: n })
      inInit = false
      return
    }
    const attr = /^ {8}self\.(\w+)\s*=/.exec(raw)
    if (attr && inInit && !cur.members.some((m) => m.kind === 'attr' && m.name === attr[1])) cur.members.push({ kind: 'attr', name: attr[1], line: n })
  })
  close(lines.length)
  return classes
}
