import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { json, jsonRequest, mountTestApp } from "../../src/http.js"

describe("json", () => {
  it("builds a Content-Type header and JSON body", () => {
    const frag = json({ name: "Alice", age: 30 })
    expect(frag.headers).toEqual({ "Content-Type": "application/json" })
    expect(frag.body).toBe('{"name":"Alice","age":30}')
  })

  it("serializes arrays", () => {
    const frag = json([1, 2, 3])
    expect(frag.body).toBe("[1,2,3]")
  })

  it("is spreadable into fetch init", () => {
    const init: RequestInit = { method: "POST", ...json({ ok: true }) }
    expect(init.method).toBe("POST")
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
    expect(init.body).toBe('{"ok":true}')
  })
})

describe("mountTestApp", () => {
  it("injects userId into context", async () => {
    const routes = new Hono()
    routes.get("/whoami", (c) => {
      const uid = c.get("userId" as never) as string
      return c.json({ uid })
    })

    const app = mountTestApp(routes, { userId: "user-42" })
    const res = await app.request("/whoami")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ uid: "user-42" })
  })

  it("defaults userId to 'test-user-id'", async () => {
    const routes = new Hono()
    routes.get("/", (c) => c.json({ uid: c.get("userId" as never) as string }))

    const app = mountTestApp(routes)
    const res = await app.request("/")
    expect(await res.json()).toEqual({ uid: "test-user-id" })
  })

  it("injects db when provided", async () => {
    const routes = new Hono()
    routes.get("/db", (c) => {
      const db = c.get("db" as never) as { tag: string }
      return c.json({ tag: db.tag })
    })

    const fakeDb = { tag: "fake" }
    const app = mountTestApp(routes, { db: fakeDb })
    const res = await app.request("/db")
    expect(await res.json()).toEqual({ tag: "fake" })
  })

  it("omits db when not provided", async () => {
    const routes = new Hono()
    routes.get("/", (c) => c.json({ db: c.get("db" as never) ?? null }))

    const app = mountTestApp(routes)
    const res = await app.request("/")
    expect(await res.json()).toEqual({ db: null })
  })

  it("injects actor with a default of 'staff'", async () => {
    const routes = new Hono()
    routes.get("/", (c) => c.json({ actor: c.get("actor" as never) as string }))

    const app = mountTestApp(routes)
    const res = await app.request("/")
    expect(await res.json()).toEqual({ actor: "staff" })
  })

  it("honors a custom actor", async () => {
    const routes = new Hono()
    routes.get("/", (c) => c.json({ actor: c.get("actor" as never) as string }))

    const app = mountTestApp(routes, { actor: "customer" })
    const res = await app.request("/")
    expect(await res.json()).toEqual({ actor: "customer" })
  })

  it("propagates extra vars from the vars option", async () => {
    const routes = new Hono()
    routes.get("/", (c) =>
      c.json({
        requestId: c.get("requestId" as never) as string,
        tenant: c.get("tenant" as never) as string,
      }),
    )

    const app = mountTestApp(routes, { vars: { requestId: "r-1", tenant: "t-1" } })
    const res = await app.request("/")
    expect(await res.json()).toEqual({ requestId: "r-1", tenant: "t-1" })
  })

  it("mounts routes at a custom basePath", async () => {
    const routes = new Hono()
    routes.get("/hello", (c) => c.json({ ok: true }))

    const app = mountTestApp(routes, { basePath: "/v1/api" })
    const res = await app.request("/v1/api/hello")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe("jsonRequest", () => {
  it("sends a GET without a body", async () => {
    const routes = new Hono()
    routes.get("/items", (c) => c.json({ data: [] }))
    const app = mountTestApp(routes)

    const res = await jsonRequest(app, "GET", "/items")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [] })
  })

  it("sends a POST with a JSON body", async () => {
    const routes = new Hono()
    routes.post("/echo", async (c) => {
      const body = await c.req.json()
      return c.json({ echoed: body }, 201)
    })
    const app = mountTestApp(routes)

    const res = await jsonRequest(app, "POST", "/echo", { name: "Bob" })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ echoed: { name: "Bob" } })
  })

  it("does not set Content-Type when body is omitted", async () => {
    const routes = new Hono()
    routes.get("/h", (c) => {
      const ct = c.req.header("content-type") ?? ""
      return c.json({ ct })
    })
    const app = mountTestApp(routes)

    const res = await jsonRequest(app, "GET", "/h")
    expect(await res.json()).toEqual({ ct: "" })
  })
})
