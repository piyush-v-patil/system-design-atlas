import type { ClassDiagram } from './types.ts'

const modules = import.meta.glob<{ default: ClassDiagram }>(['./*.ts', '!./types.ts', '!./index.ts'], { eager: true })
export const classDiagrams: Record<string, ClassDiagram> = Object.fromEntries(Object.values(modules).map((m) => [m.default.oodId, m.default]))
