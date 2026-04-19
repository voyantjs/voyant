# @voyantjs/workflows-node-step-container

Reference Cloudflare Container image that executes workflow steps
declared with `runtime: "node"`. The orchestrator (running as a Worker
+ Durable Object) dispatches individual step invocations to a container
in this image via `createCfContainerStepRunner` from
`@voyantjs/workflows-orchestrator-cloudflare`.

## Protocol

The orchestrator's runner sends `POST /step` with:

```json
{
  "runId": "run_...",
  "workflowId": "process-upload",
  "workflowVersion": "v1",
  "stepId": "hash-source",
  "attempt": 1,
  "input": { ... },
  "options": { "machine": "standard-2", "timeout": "30s" }
}
```

Optional header `x-voyant-step-auth: <hmac>` is verified against
`VOYANT_STEP_SECRET` when set.

Response is a `StepJournalEntry`:

```json
{
  "attempt": 1,
  "status": "ok",
  "output": { "hash": "sha256:..." },
  "startedAt": 1776451106797,
  "finishedAt": 1776451106897,
  "runtime": "node"
}
```

## Wiring

### Orchestrator side (Worker + DO)

```ts
import { createCfContainerStepRunner } from "@voyantjs/workflows-orchestrator-cloudflare";
import { createStepHandler } from "@voyantjs/workflows/handler";

export default {
  fetch(req, env) {
    const nodeStepRunner = createCfContainerStepRunner({
      namespace: env.NODE_STEP_POOL,
    });
    const stepHandler = createStepHandler({ nodeStepRunner });
    // ... wire stepHandler into handleWorkerRequest / DO
  },
};
```

### Wrangler binding (orchestrator's `wrangler.jsonc`)

```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "WORKFLOW_RUN_DO", "class_name": "WorkflowRunDO" },
      { "name": "NODE_STEP_POOL", "class_name": "NodeStepContainer" }
    ]
  },
  "containers": [
    {
      "class_name": "NodeStepContainer",
      "image": "./apps/workflows-node-step-container/Dockerfile",
      "instance_type": "standard-2",
      // "lite" | "basic" | "standard-1" | "standard-2" | "standard-3" | "standard-4"
      "max_instances": 50
    }
  ]
}
```

### Container class (orchestrator Worker)

```ts
import { Container } from "@cloudflare/containers";

export class NodeStepContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
}
```

## Build

```bash
# 1. Build your workflow bundle separately
voyant workflows build --file ./src/workflows.ts --out ./dist
cp ./dist/bundle.mjs ./apps/workflows-node-step-container/bundle.mjs

# 2. Deploy via wrangler (builds + pushes the image)
wrangler deploy
```

## Limitations (v1 reference)

The container replays the entire workflow body on each step dispatch
(no journal is passed through). That means:

- **Multiple node steps per workflow** — steps other than the target
  will also execute in the container. Safe only when step bodies are
  idempotent. Use `idempotencyKey` on `StepOptions` for external
  side effects.
- **No in-flight cancellation** — the runner threads `stepCtx.signal`
  to the `fetch`, but the container's `executeWorkflowStep` call
  doesn't currently observe a mid-step abort.

Production fixes (tracked separately):
- Journal pass-through in the dispatch payload (skip cached steps).
- Stop-after-target sentinel in the container's step runner.
- Or: per-step registration so bodies can be resolved by id without
  full body replay.
