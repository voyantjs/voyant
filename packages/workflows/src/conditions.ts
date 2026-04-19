// Condition types used in step options (waitFor / cancelIf / skipIf)
// and in event-filter match expressions.
// Authoritative contract in docs/sdk-surface.md §4.

import type { Duration, RunStatus } from "./types.js"

export interface EventCondition {
  event: string
  match?: Record<string, unknown> | ((payload: unknown) => boolean)
}

export interface SignalCondition {
  signal: string
  match?: Record<string, unknown> | ((payload: unknown) => boolean)
}

export interface TimeCondition {
  after?: Duration | Date
  before?: Duration | Date
}

export interface RunStatusCondition {
  run: { id: string; status: RunStatus[] }
}

export interface OrCondition {
  or: Condition[]
}

export interface AndCondition {
  and: Condition[]
}

export type Condition =
  | EventCondition
  | SignalCondition
  | TimeCondition
  | RunStatusCondition
  | OrCondition
  | AndCondition

export const or = (...conditions: Condition[]): OrCondition => ({ or: conditions })
export const and = (...conditions: Condition[]): AndCondition => ({ and: conditions })
