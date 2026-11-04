/**
 * Hand-picked associations for the OOD class diagrams. Classes, inheritance, members and line numbers are read from
 * the notebook code by src/ood/parsePython.ts; only "this attribute holds that class" is curated here, because Python
 * attributes carry no types. tests/ood.test.ts checks each attribute exists on its class.
 */
export interface Association {
  from: string
  /** Instance attribute of `from` (set in __init__). */
  attr: string
  to: string
  /** Holds many (a list or dict of `to`). */
  many?: boolean
}

export interface ClassDiagram {
  oodId: string
  associations: Association[]
  /** Observations about the code itself (it is shown unchanged). */
  notes?: string[]
}
