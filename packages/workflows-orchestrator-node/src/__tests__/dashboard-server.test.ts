import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createNodeSelfHostDeps, handleRequest } from "../dashboard-server.js"
import type { SnapshotRunStore } from "../snapshot-run-store.js"

const emptyStore: SnapshotRunStore = {
  save: async () => {
    throw new Error("not implemented")
  },
  get: async () => undefined,
  list: async () => [],
}

describe("handleRequest health endpoints", () => {
  it("serves a default liveness response", async () => {
    const response = await handleRequest(
      { method: "GET", url: "http://local/healthz" },
      { store: emptyStore },
    )

    expect(response.status).toBe(200)
    expect(JSON.parse(String(response.body))).toMatchObject({
      ok: true,
      service: "voyant-workflows-selfhost",
    })
  })

  it("returns not ready when no workflow entry is configured", async () => {
    const response = await handleRequest(
      { method: "GET", url: "http://local/readyz" },
      { store: emptyStore },
    )

    expect(response.status).toBe(503)
    expect(JSON.parse(String(response.body))).toMatchObject({
      ok: false,
      checks: {
        workflowEntry: "error",
      },
    })
  })

  it("reports readiness check failures", async () => {
    const response = await handleRequest(
      { method: "GET", url: "http://local/readyz" },
      {
        store: emptyStore,
        triggerRun: async () => ({
          ok: true as const,
          saved: {
            id: "run_1",
            workflowId: "wf",
            status: "waiting",
            startedAt: 0,
            result: { status: "waiting", startedAt: 0, tags: [] },
          },
        }),
        readinessCheck: async () => {
          throw new Error("database unavailable")
        },
      },
    )

    expect(response.status).toBe(503)
    expect(JSON.parse(String(response.body))).toMatchObject({
      ok: false,
      checks: {
        self: "error",
      },
      details: {
        error: "database unavailable",
      },
    })
  })

  it("serves Prometheus-style metrics", async () => {
    const response = await handleRequest(
      { method: "GET", url: "http://local/metrics" },
      {
        store: emptyStore,
        collectMetrics: async () =>
          [
            "# HELP voyant_selfhost_up Self-host server availability.",
            "# TYPE voyant_selfhost_up gauge",
            "voyant_selfhost_up 1",
            "",
          ].join("\n"),
      },
    )

    expect(response.status).toBe(200)
    expect(response.headers["content-type"]).toContain("text/plain")
    expect(String(response.body)).toContain("voyant_selfhost_up 1")
  })
})

describe("createNodeSelfHostDeps validation", () => {
  it("fails clearly when the workflow entry file does not exist", async () => {
    await expect(
      createNodeSelfHostDeps({
        entryFile: "./definitely-missing-workflows.mjs",
      }),
    ).rejects.toThrow(/workflow entry not found/i)
  })

  it("fails clearly when the workflow entry registers no workflows", async () => {
    const root = await mkdtemp(join(process.cwd(), ".tmp-empty-workflow-entry-"))
    try {
      const entryFile = join(root, "empty-workflows.mjs")
      const staticDir = join(root, "static")
      await mkdir(staticDir, { recursive: true })
      await writeFile(entryFile, "export const nothing = true;\n", "utf8")

      await expect(
        createNodeSelfHostDeps({
          entryFile,
          staticDir,
          cacheBustEntry: true,
        }),
      ).rejects.toThrow(/registered no workflows/i)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
