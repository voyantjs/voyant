import type { Actor } from "@voyantjs/core"
import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { createApp } from "../../src/app.js"
import type { HonoModule } from "../../src/module.js"
import type { VoyantBindings } from "../../src/types.js"

const TEST_ENV: VoyantBindings = { DATABASE_URL: "postgres://test" }

const TEST_CTX = {
  waitUntil: () => {},
  passThroughOnException: () => {},
  // biome-ignore lint/suspicious/noExplicitAny: mock ExecutionContext for tests
} as any

function makeModule(options: {
  name: string
  admin?: boolean
  public_?: boolean
  legacy?: boolean
}): HonoModule {
  const admin = new Hono().get("/ping", (c) => c.json({ surface: "admin", name: options.name }))
  const pub = new Hono().get("/ping", (c) => c.json({ surface: "public", name: options.name }))
  const legacy = new Hono().get("/ping", (c) => c.json({ surface: "legacy", name: options.name }))

  return {
    module: { name: options.name },
    ...(options.admin ? { adminRoutes: admin } : {}),
    ...(options.public_ ? { publicRoutes: pub } : {}),
    ...(options.legacy ? { routes: legacy } : {}),
  }
}

/**
 * Builds a test app that resolves every request to `{ userId, actor }`, so
 * that requireAuth marks the request authenticated and requireActor sees the
 * intended actor.
 */
function build(actor: Actor | undefined, mods: HonoModule[]) {
  return createApp({
    // biome-ignore lint/suspicious/noExplicitAny: test doesn't use db
    db: () => ({}) as any,
    modules: mods,
    auth: {
      resolve: () => (actor === undefined ? { userId: "u1" } : { userId: "u1", actor }),
    },
  })
}

describe("createApp surface mounting", () => {
  it("mounts adminRoutes under /v1/admin/{name}", async () => {
    const app = build("staff", [makeModule({ name: "things", admin: true })])
    const res = await app.request("/v1/admin/things/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { surface: string }
    expect(body.surface).toBe("admin")
  })

  it("mounts publicRoutes under /v1/public/{name}", async () => {
    const app = build("customer", [makeModule({ name: "things", public_: true })])
    const res = await app.request("/v1/public/things/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { surface: string }
    expect(body.surface).toBe("public")
  })

  it("still mounts legacy routes under /v1/{name}", async () => {
    const app = build("staff", [makeModule({ name: "things", legacy: true })])
    const res = await app.request("/v1/things/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { surface: string }
    expect(body.surface).toBe("legacy")
  })

  it("blocks customer on /v1/admin/*", async () => {
    const app = build("customer", [makeModule({ name: "only-admin", admin: true })])
    const res = await app.request("/v1/admin/only-admin/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(403)
  })

  it("blocks staff on /v1/public/*", async () => {
    const app = build("staff", [makeModule({ name: "only-public", public_: true })])
    const res = await app.request("/v1/public/only-public/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(403)
  })

  it("allows partner on /v1/public/*", async () => {
    const app = build("partner", [makeModule({ name: "things", public_: true })])
    const res = await app.request("/v1/public/things/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
  })

  it("allows supplier on /v1/public/*", async () => {
    const app = build("supplier", [makeModule({ name: "things", public_: true })])
    const res = await app.request("/v1/public/things/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
  })

  it("treats missing actor as staff on admin surface", async () => {
    const app = build(undefined, [makeModule({ name: "things", admin: true })])
    const res = await app.request("/v1/admin/things/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
  })

  it("supports a module exposing both admin and public routes", async () => {
    const app = createApp({
      // biome-ignore lint/suspicious/noExplicitAny: test doesn't use db
      db: () => ({}) as any,
      modules: [makeModule({ name: "bookings", admin: true, public_: true })],
      auth: {
        resolve: (args) => {
          const actor: Actor = new URL(args.request.url).pathname.startsWith("/v1/admin/")
            ? "staff"
            : "customer"
          return { userId: "u1", actor }
        },
      },
    })

    const adminRes = await app.request("/v1/admin/bookings/ping", {}, TEST_ENV, TEST_CTX)
    expect(adminRes.status).toBe(200)
    expect(((await adminRes.json()) as { surface: string }).surface).toBe("admin")

    const publicRes = await app.request("/v1/public/bookings/ping", {}, TEST_ENV, TEST_CTX)
    expect(publicRes.status).toBe(200)
    expect(((await publicRes.json()) as { surface: string }).surface).toBe("public")
  })

  it("exposes /health publicly without auth", async () => {
    const app = createApp({
      // biome-ignore lint/suspicious/noExplicitAny: test doesn't use db
      db: () => ({}) as any,
      modules: [],
    })
    const res = await app.request("/health", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string }
    expect(body.status).toBe("ok")
  })
})
