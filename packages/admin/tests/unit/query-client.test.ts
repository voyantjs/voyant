import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { makeQueryClient } from "../../src/providers/query-client.js"

describe("makeQueryClient", () => {
  it("returns an instance of QueryClient", () => {
    const client = makeQueryClient()
    expect(client).toBeInstanceOf(QueryClient)
  })

  it("applies Voyant default options", () => {
    const client = makeQueryClient()
    const queryDefaults = client.getDefaultOptions().queries
    const mutationDefaults = client.getDefaultOptions().mutations
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false)
    expect(queryDefaults?.retry).toBe(1)
    expect(mutationDefaults?.retry).toBe(0)
  })

  it("allows callers to override query defaults", () => {
    const client = makeQueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000, retry: 3 },
      },
    })
    const queries = client.getDefaultOptions().queries
    expect(queries?.staleTime).toBe(60_000)
    expect(queries?.retry).toBe(3)
    // Non-overridden defaults should persist.
    expect(queries?.refetchOnWindowFocus).toBe(false)
  })

  it("allows callers to override mutation defaults", () => {
    const client = makeQueryClient({
      defaultOptions: {
        mutations: { retry: 5 },
      },
    })
    expect(client.getDefaultOptions().mutations?.retry).toBe(5)
  })

  it("returns independent client instances per call", () => {
    const a = makeQueryClient()
    const b = makeQueryClient()
    expect(a).not.toBe(b)
  })
})
