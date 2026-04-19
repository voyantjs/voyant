// Shapes for the Gantt-tree timeline rendered in the detail pane.
//
// Each `Span` corresponds to one row. Spans are derived from the
// wire-level events (`TimelineEvent[]`) by pairing `.started/.ok/.err`
// events and resolving waitpoints. In-flight spans leave `endAt`
// undefined; the renderer fills the tail with "now".

export type SpanKind = "run" | "step" | "waitpoint" | "log" | "stream" | "compensation"

export type SpanStatus = "ok" | "err" | "pending" | "resolved" | "cancelled"

export interface Span {
  id: string
  kind: SpanKind
  label: string
  at: number
  /** undefined → in-flight; renderer fills with `now` */
  endAt?: number
  status: SpanStatus
  /** Optional extra shown on the row (kind-specific sublabel). */
  sublabel?: string
  /** Used when opening a side-detail panel. */
  detail: SpanDetail
  children?: Span[]
}

export type SpanDetail =
  | { kind: "run"; output?: unknown; error?: { message: string; code: string } }
  | {
      kind: "step"
      stepId: string
      attempt: number
      output?: unknown
      error?: { message: string; code: string }
    }
  | {
      kind: "waitpoint"
      waitpointId: string
      waitpointKind: "DATETIME" | "EVENT" | "SIGNAL" | "RUN" | "MANUAL"
      meta?: Record<string, unknown>
      payload?: unknown
      error?: { message: string; code: string }
    }
  | { kind: "log"; level: "info" | "warn" | "error"; message: string; stepId?: string }
  | {
      kind: "stream"
      streamId: string
      seq: number
      encoding: "text" | "json" | "base64"
      chunk: unknown
      final: boolean
    }
  | {
      kind: "compensation"
      stepId: string
      status: "ok" | "err"
      error?: { message: string }
    }
