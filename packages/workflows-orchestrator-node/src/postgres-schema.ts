import { bigint, index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core"

export const snapshotRunsTable = pgTable(
  "voyant_snapshot_runs",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id").notNull(),
    status: text("status").notNull(),
    startedAt: bigint("started_at", { mode: "number" }).notNull(),
    completedAt: bigint("completed_at", { mode: "number" }),
    durationMs: integer("duration_ms"),
    tags: jsonb("tags").$type<string[]>().notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    input: jsonb("input").$type<unknown>(),
    runRecord: jsonb("run_record").$type<Record<string, unknown>>(),
    entryFile: text("entry_file"),
    replayOf: text("replay_of"),
  },
  (table) => ({
    workflowStartedIdx: index("voyant_snapshot_runs_workflow_started_idx").on(
      table.workflowId,
      table.startedAt,
    ),
    statusStartedIdx: index("voyant_snapshot_runs_status_started_idx").on(
      table.status,
      table.startedAt,
    ),
  }),
)

export const wakeupsTable = pgTable(
  "voyant_wakeups",
  {
    runId: text("run_id").primaryKey(),
    wakeAt: bigint("wake_at", { mode: "number" }).notNull(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: bigint("lease_expires_at", { mode: "number" }),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    dueIdx: index("voyant_wakeups_due_idx").on(table.wakeAt),
    leaseIdx: index("voyant_wakeups_lease_idx").on(table.leaseExpiresAt),
  }),
)
