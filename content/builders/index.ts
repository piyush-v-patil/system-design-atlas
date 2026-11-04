import type { Builder } from './types.ts'

const modules = import.meta.glob<{ default: Builder }>(['./*.ts', '!./types.ts', '!./index.ts'], { eager: true })

/** Architecture builders keyed by solution id. */
export const builders: Record<string, Builder> = Object.fromEntries(Object.values(modules).map((m) => [m.default.solutionId, m.default]))
export const getBuilder = (solutionId: string): Builder | undefined => builders[solutionId]
