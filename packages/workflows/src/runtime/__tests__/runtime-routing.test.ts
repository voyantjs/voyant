import { beforeEach, describe, expect, it } from "vitest"
import { __resetRegistry, getWorkflow, workflow } from "../../workflow.js"
import { executeWorkflowStep, type StepRunner } from "../executor.js"
import { emptyJournal } from "../journal.js"

beforeEach(() => {
  __resetRegistry()
})

interface RouteLog {
  runtime: "edge" | "node"
  stepId: string
}

function makeTracker(runtime: "edge" | "node", log: RouteLog[]): StepRunner {
  return async ({ stepId, attempt, fn, stepCtx }) => {
    log.push({ runtime, stepId })
    const output = await fn(stepCtx)
    return { attempt, status: "ok", output, startedAt: 0, finishedAt: 0 }
  }
}

function baseReq(workflowId: string) {
  return {
    runId: "run_test",
    workflowId,
    workflowVersion: "test",
    input: undefined as unknown,
    journal: emptyJournal(),
    invocationCount: 1,
    environment: {
      run: {
        id: "run_test",
        number: 1,
        attempt: 1,
        triggeredBy: { kind: "api" as const },
        tags: [],
        startedAt: 0,
      },
      workflow: { id: workflowId, version: "test" },
      environment: { name: "development" as const },
      project: { id: "prj", slug: "p" },
      organization: { id: "org", slug: "o" },
    },
    triggeredBy: { kind: "api" as const },
    runStartedAt: 0,
    tags: [],
  }
}

describe("step runtime routing", () => {
  it("routes steps without options.runtime through the edge runner", async () => {
    workflow<void, string>({
      id: "rt.default",
      async run(_, ctx) {
        return await ctx.step("a", () => "ok")
      },
    })

    const log: RouteLog[] = []
    const def = getWorkflow("rt.default")!
    const response = await executeWorkflowStep(def, {
      ...baseReq("rt.default"),
      stepRunner: makeTracker("edge", log),
    })

    expect(response.status).toBe("completed")
    expect(log).toEqual([{ runtime: "edge", stepId: "a" }])
  })

  it("routes runtime=node through the node runner when wired", async () => {
    workflow<void, string>({
      id: "rt.node",
      async run(_, ctx) {
        const a = await ctx.step("edge-step", () => "a")
        const b = await ctx.step("node-step", { runtime: "node" }, () => "b")
        return `${a}${b}`
      },
    })

    const log: RouteLog[] = []
    const def = getWorkflow("rt.node")!
    const response = await executeWorkflowStep(def, {
      ...baseReq("rt.node"),
      stepRunner: makeTracker("edge", log),
      nodeStepRunner: makeTracker("node", log),
    })

    expect(response.status).toBe("completed")
    if (response.status === "completed") {
      expect(response.output).toBe("ab")
    }
    expect(log).toEqual([
      { runtime: "edge", stepId: "edge-step" },
      { runtime: "node", stepId: "node-step" },
    ])
  })

  it("fails with NODE_RUNTIME_UNAVAILABLE when a node step has no runner", async () => {
    workflow<void, string>({
      id: "rt.missing",
      async run(_, ctx) {
        return await ctx.step("c", { runtime: "node", retry: { max: 0 } }, () => "x")
      },
    })

    const def = getWorkflow("rt.missing")!
    const response = await executeWorkflowStep(def, {
      ...baseReq("rt.missing"),
      stepRunner: makeTracker("edge", []),
      // no nodeStepRunner
    })

    expect(response.status).toBe("failed")
    if (response.status === "failed") {
      expect(response.error.code).toBe("NODE_RUNTIME_UNAVAILABLE")
    }
  })

  it("honors explicit runtime=edge even when a node runner is wired", async () => {
    workflow<void, string>({
      id: "rt.explicit-edge",
      async run(_, ctx) {
        return await ctx.step("a", { runtime: "edge" }, () => "ok")
      },
    })

    const log: RouteLog[] = []
    const def = getWorkflow("rt.explicit-edge")!
    const response = await executeWorkflowStep(def, {
      ...baseReq("rt.explicit-edge"),
      stepRunner: makeTracker("edge", log),
      nodeStepRunner: makeTracker("node", log),
    })

    expect(response.status).toBe("completed")
    expect(log).toEqual([{ runtime: "edge", stepId: "a" }])
  })

  it("stamps the runtime on the returned journal entry", async () => {
    workflow<void, string>({
      id: "rt.stamp",
      async run(_, ctx) {
        const a = await ctx.step("edge-a", () => "A")
        const b = await ctx.step("node-b", { runtime: "node" }, () => "B")
        return `${a}${b}`
      },
    })

    const def = getWorkflow("rt.stamp")!
    const req = baseReq("rt.stamp")
    const response = await executeWorkflowStep(def, {
      ...req,
      stepRunner: makeTracker("edge", []),
      nodeStepRunner: makeTracker("node", []),
    })

    expect(response.status).toBe("completed")
    const journal = response.journal
    expect(journal.stepResults["edge-a"]!.runtime).toBe("edge")
    expect(journal.stepResults["node-b"]!.runtime).toBe("node")
  })
})
