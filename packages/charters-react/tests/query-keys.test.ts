import { describe, expect, it } from "vitest"

import { chartersQueryKeys } from "../src/query-keys.js"

describe("chartersQueryKeys", () => {
  it("roots all keys at ['voyant', 'charters']", () => {
    expect(chartersQueryKeys.all).toEqual(["voyant", "charters"])
  })

  it("derives products() and productsList() correctly", () => {
    expect(chartersQueryKeys.products()).toEqual(["voyant", "charters", "products"])
    expect(chartersQueryKeys.productsList({ status: "live", limit: 50 })).toEqual([
      "voyant",
      "charters",
      "products",
      "list",
      { status: "live", limit: 50 },
    ])
  })

  it("product() captures the include array (default empty)", () => {
    expect(chartersQueryKeys.product("chrt_abc")).toEqual([
      "voyant",
      "charters",
      "products",
      "detail",
      "chrt_abc",
      [],
    ])
    expect(chartersQueryKeys.product("chrt_abc", ["voyages"])).toEqual([
      "voyant",
      "charters",
      "products",
      "detail",
      "chrt_abc",
      ["voyages"],
    ])
  })

  it("voyage() supports the unified key (local typeid OR external <provider>:<ref>)", () => {
    expect(chartersQueryKeys.voyage("voyant-connect:ext-1", ["suites"])).toEqual([
      "voyant",
      "charters",
      "voyages",
      "detail",
      "voyant-connect:ext-1",
      ["suites"],
    ])
  })

  it("yacht() and yachtsList() share the yachts root", () => {
    expect(chartersQueryKeys.yacht("chry_xyz")).toEqual([
      "voyant",
      "charters",
      "yachts",
      "detail",
      "chry_xyz",
    ])
    expect(chartersQueryKeys.yachtsList({ yachtClass: "luxury_motor" })).toEqual([
      "voyant",
      "charters",
      "yachts",
      "list",
      { yachtClass: "luxury_motor" },
    ])
  })

  it("public surface keys are namespaced under 'public'", () => {
    expect(chartersQueryKeys.publicProductsList({})).toEqual([
      "voyant",
      "charters",
      "public",
      "products",
      "list",
      {},
    ])
    expect(chartersQueryKeys.publicProduct("med-spring")).toEqual([
      "voyant",
      "charters",
      "public",
      "products",
      "detail",
      "med-spring",
    ])
    expect(chartersQueryKeys.publicVoyage("chrv_xyz")).toEqual([
      "voyant",
      "charters",
      "public",
      "voyages",
      "detail",
      "chrv_xyz",
    ])
  })
})
