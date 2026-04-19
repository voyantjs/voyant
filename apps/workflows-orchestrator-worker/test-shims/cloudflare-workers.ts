// Test-only shim for the `cloudflare:workers` module specifier.
// `@cloudflare/containers` imports `DurableObject` and
// `WorkerEntrypoint` from it — both only exist inside the CF Workers
// runtime. Under plain Node (vitest), we alias this module to these
// minimal stubs. The orchestrator-worker's unit tests never invoke
// NodeStepContainer directly; they just need the module graph to load.

export class DurableObject {}

export class WorkerEntrypoint {}
