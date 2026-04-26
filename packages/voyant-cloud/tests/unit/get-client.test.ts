import { describe, expect, it } from "vitest"

import {
  getVoyantCloudClient,
  tryGetVoyantCloudClient,
  VoyantCloudClient,
  VoyantCloudConfigError,
} from "../../src/index.js"

describe("getVoyantCloudClient", () => {
  it("returns a client when the api key is set", () => {
    const client = getVoyantCloudClient({ VOYANT_CLOUD_API_KEY: "k_test" })
    expect(client).toBeInstanceOf(VoyantCloudClient)
    expect(client.transport.baseUrl).toBe("https://api.voyantjs.com")
  })

  it("honors a custom base url and user agent", () => {
    const client = getVoyantCloudClient({
      VOYANT_CLOUD_API_KEY: "k_test",
      VOYANT_CLOUD_API_URL: "https://cloud.example.com",
      VOYANT_CLOUD_USER_AGENT: "voyant-test/1.0",
    })
    expect(client.transport.baseUrl).toBe("https://cloud.example.com")
  })

  it("throws VoyantCloudConfigError when the api key is missing", () => {
    expect(() => getVoyantCloudClient({})).toThrow(VoyantCloudConfigError)
    expect(() => getVoyantCloudClient({ VOYANT_CLOUD_API_KEY: "" })).toThrow(VoyantCloudConfigError)
  })

  it("accepts overrides that supply the api key directly", () => {
    const client = getVoyantCloudClient({}, { apiKey: "k_override" })
    expect(client).toBeInstanceOf(VoyantCloudClient)
  })
})

describe("tryGetVoyantCloudClient", () => {
  it("returns null when the api key is missing", () => {
    expect(tryGetVoyantCloudClient({})).toBeNull()
  })

  it("returns a client when the api key is set", () => {
    expect(tryGetVoyantCloudClient({ VOYANT_CLOUD_API_KEY: "k_test" })).toBeInstanceOf(
      VoyantCloudClient,
    )
  })
})
