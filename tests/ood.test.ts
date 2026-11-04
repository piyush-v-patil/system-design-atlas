/** OOD class diagrams: the parser reads the notebook code faithfully and every curated association is real. */
import { describe, expect, it } from 'vitest'
import { classDiagrams } from '../content/class-diagrams/index.ts'
import { oods } from '../src/lib/problems.ts'
import { layoutClasses } from '../src/ood/ClassDiagram.tsx'
import { parsePython } from '../src/ood/parsePython.ts'

const codeOf = (id: string) => oods.find((o) => o.id === id)!.cells.find((c) => c.cellType === 'code' && /^class /m.test(c.source))!.source

describe('OOD class diagrams', () => {
  it('exist for every OOD problem', () => {
    expect(Object.keys(classDiagrams).sort()).toEqual(oods.map((o) => o.id).sort())
  })

  it('finds every class the code defines, with its line', () => {
    for (const o of oods) {
      const code = codeOf(o.id)
      const lines = code.split('\n')
      const classes = parsePython(code)
      const expected = lines.filter((l) => /^class \w+/.test(l)).length
      expect(classes, o.id).toHaveLength(expected)
      for (const c of classes) {
        expect(lines[c.line - 1]).toMatch(new RegExp(`^class ${c.name}\\b`))
        for (const m of c.members) {
          expect(m.line, `${o.id} ${c.name}.${m.name}`).toBeGreaterThan(c.line)
          expect(m.line).toBeLessThanOrEqual(c.end)
          expect(lines[m.line - 1]).toContain(m.kind === 'attr' ? `self.${m.name}` : m.name)
        }
      }
    }
  })

  it('reads inheritance and members as written', () => {
    const pl = parsePython(codeOf('parking-lot'))
    const byName = new Map(pl.map((c) => [c.name, c]))
    expect(pl.map((c) => c.name)).toEqual(['VehicleSize', 'Vehicle', 'Motorcycle', 'Car', 'Bus', 'ParkingLot', 'Level', 'ParkingSpot'])
    expect(byName.get('VehicleSize')!.isEnum).toBe(true)
    expect(byName.get('Vehicle')!.isAbstract).toBe(true)
    expect(['Motorcycle', 'Car', 'Bus'].map((n) => byName.get(n)!.bases)).toEqual([['Vehicle'], ['Vehicle'], ['Vehicle']])
    expect(byName.get('Vehicle')!.members.filter((m) => m.kind === 'attr').map((m) => m.name)).toEqual(['vehicle_size', 'license_plate', 'spot_size', 'spots_taken'])
    expect(byName.get('Level')!.members.find((m) => m.kind === 'const')?.name).toBe('SPOTS_PER_ROW')
    const card = parsePython(codeOf('deck-of-cards')).find((c) => c.name === 'Card')!
    expect(card.members.filter((m) => m.name === 'value' && m.kind === 'method')).toHaveLength(1)
    expect(card.members.find((m) => m.name === 'value' && m.kind === 'method')).toMatchObject({ abstract: true, property: true })
    // the notebook's "def get(self, query)" lacks a colon but is still a method
    expect(parsePython(codeOf('lru-cache')).find((c) => c.name === 'Cache')!.members.some((m) => m.name === 'get')).toBe(true)
  })

  it('every association joins real classes through a real attribute', () => {
    const problems: string[] = []
    for (const d of Object.values(classDiagrams)) {
      const classes = parsePython(codeOf(d.oodId))
      for (const a of d.associations) {
        const from = classes.find((c) => c.name === a.from)
        if (!from) problems.push(`${d.oodId}: no class ${a.from}`)
        else if (!from.members.some((m) => m.kind === 'attr' && m.name === a.attr)) problems.push(`${d.oodId}: ${a.from} has no attribute ${a.attr}`)
        if (!classes.some((c) => c.name === a.to)) problems.push(`${d.oodId}: no class ${a.to}`)
      }
    }
    expect(problems).toEqual([])
  })

  it('lays out classes without overlaps', () => {
    for (const o of oods) {
      const { placed } = layoutClasses(parsePython(codeOf(o.id)))
      const ps = [...placed.values()]
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]
          const b = ps[j]
          const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
          expect(overlap, `${o.id}: ${a.c.name} / ${b.c.name}`).toBe(false)
        }
    }
  })
})
