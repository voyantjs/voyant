import type { Actor } from "@voyantjs/core"
import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { createApp } from "../../src/app.js"
import type { HonoModule } from "../../src/module.js"
import { defineHonoPlugin, expandHonoPlugins } from "../../src/plugin.js"
import type { VoyantBindings } from "../../src/types.js"

const TEST_ENV: VoyantBindings = { DATABASE_URL: "postgres://test" }
const TEST_CTX = {
  waitUntil: () => {},
  passThroughOnException: () => {},
  // biome-ignore lint/suspicious/noExplicitAny: mock ExecutionContext for tests
} as any

function makeModule(name: string, surface: "admin" | "public"): HonoModule {
  const routes = new Hono().get("/ping", (c) => c.json({ name, surface }))
  return {
    module: { name },
    ...(surface === "admin" ? { adminRoutes: routes } : { publicRoutes: routes }),
  }
}

describe("expandHonoPlugins", () => {
  it("returns empty collections for no plugins", () => {
    const result = expandHonoPlugins([])
    expect(result.modules).toEqual([])
    expect(result.extensions).toEqual([])
    expect(result.subscribers).toEqual([])
    expect(result.links).toEqual([])
  })

  it("flattens modules from plugins in order", () => {
    const m1 = makeModule("m1", "admin")
    const m2 = makeModule("m2", "admin")
    const plugin = defineHonoPlugin({ name: "p1", modules: [m1, m2] })
    const result = expandHonoPlugins([plugin])
    expect(result.modules).toEqual([m1, m2])
  })

  it("throws on duplicate plugin names", () => {
    const p1 = defineHonoPlugin({ name: "dup" })
    const p2 = defineHonoPlugin({ name: "dup" })
    expect(() => expandHonoPlugins([p1, p2])).toThrow(/Duplicate plugin name/)
  })

  it("defineHonoPlugin returns the plugin unchanged", () => {
    const p = defineHonoPlugin({ name: "x", version: "1.0.0" })
    expect(p.name).toBe("x")
    expect(p.version).toBe("1.0.0")
  })
})

describe("createApp with plugins", () => {
  function build(plugins: ReturnType<typeof defineHonoPlugin>[], actor: Actor = "staff") {
    return createApp({
      // biome-ignore lint/suspicious/noExplicitAny: test doesn't use db
      db: () => ({}) as any,
      plugins,
      auth: { resolve: () => ({ userId: "u1", actor }) },
    })
  }

  it("mounts plugin-contributed admin routes", async () => {
    const plugin = defineHonoPlugin({
      name: "widgets",
      modules: [makeModule("widgets", "admin")],
    })
    const app = build([plugin])
    const res = await app.request("/v1/admin/widgets/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { name: string; surface: string }
    expect(body.name).toBe("widgets")
    expect(body.surface).toBe("admin")
  })

  it("mounts plugin-contributed public routes", async () => {
    const plugin = defineHonoPlugin({
      name: "catalog",
      modules: [makeModule("catalog", "public")],
    })
    const app = build([plugin], "customer")
    const res = await app.request("/v1/public/catalog/ping", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
  })

  it("combines top-level modules with plugin modules", async () => {
    const top = makeModule("top", "admin")
    const viaPlugin = makeModule("viaPlugin", "admin")
    const plugin = defineHonoPlugin({ name: "p", modules: [viaPlugin] })
    const app = createApp({
      // biome-ignore lint/suspicious/noExplicitAny: test doesn't use db
      db: () => ({}) as any,
      modules: [top],
      plugins: [plugin],
      auth: { resolve: () => ({ userId: "u1", actor: "staff" }) },
    })
    const r1 = await app.request("/v1/admin/top/ping", {}, TEST_ENV, TEST_CTX)
    const r2 = await app.request("/v1/admin/viaPlugin/ping", {}, TEST_ENV, TEST_CTX)
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
  })

  it("registers plugin module services in the container", async () => {
    const spy = { called: false }
    const mod: HonoModule = {
      module: { name: "svc", service: { ping: () => "pong" } },
      adminRoutes: new Hono().get("/check", (c) => {
        const container = c.var.container
        const svc = container.resolve<{ ping: () => string }>("svc")
        spy.called = true
        return c.json({ result: svc.ping() })
      }),
    }
    const plugin = defineHonoPlugin({ name: "svc-plugin", modules: [mod] })
    const app = build([plugin])
    const res = await app.request("/v1/admin/svc/check", {}, TEST_ENV, TEST_CTX)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { result: string }
    expect(body.result).toBe("pong")
    expect(spy.called).toBe(true)
  })

  it("throws on duplicate plugin names when passed to createApp", () => {
    const p1 = defineHonoPlugin({ name: "dup" })
    const p2 = defineHonoPlugin({ name: "dup" })
    expect(() =>
      createApp({
        // biome-ignore lint/suspicious/noExplicitAny: test doesn't use db
        db: () => ({}) as any,
        plugins: [p1, p2],
      }),
    ).toThrow(/Duplicate plugin name/)
  })
})
