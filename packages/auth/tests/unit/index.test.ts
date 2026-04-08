import { describe, expect, it } from "vitest"

import {
  attachOrganizationHeaders,
  isPublicPath,
  isStaticPath,
  parseVoyantSubdomain,
} from "../../src/index.js"

describe("isStaticPath", () => {
  it("returns true for _next paths", () => {
    expect(isStaticPath("/_next/static/chunks/main.js")).toBe(true)
    expect(isStaticPath("/_next/image?url=foo")).toBe(true)
  })

  it("returns true for image file extensions", () => {
    expect(isStaticPath("/logo.svg")).toBe(true)
    expect(isStaticPath("/photo.png")).toBe(true)
    expect(isStaticPath("/hero.jpg")).toBe(true)
    expect(isStaticPath("/avatar.jpeg")).toBe(true)
    expect(isStaticPath("/banner.gif")).toBe(true)
    expect(isStaticPath("/bg.webp")).toBe(true)
    expect(isStaticPath("/favicon.ico")).toBe(true)
  })

  it("returns false for non-static paths", () => {
    expect(isStaticPath("/api/users")).toBe(false)
    expect(isStaticPath("/dashboard")).toBe(false)
    expect(isStaticPath("/login")).toBe(false)
  })
})

describe("isPublicPath", () => {
  it("returns true for auth-related paths", () => {
    expect(isPublicPath("/login")).toBe(true)
    expect(isPublicPath("/auth")).toBe(true)
    expect(isPublicPath("/auth/callback")).toBe(true)
    expect(isPublicPath("/sign-in")).toBe(true)
    expect(isPublicPath("/sign-up")).toBe(true)
    expect(isPublicPath("/forgot-password")).toBe(true)
    expect(isPublicPath("/reset-password")).toBe(true)
  })

  it("returns false for protected paths", () => {
    expect(isPublicPath("/dashboard")).toBe(false)
    expect(isPublicPath("/api/users")).toBe(false)
    expect(isPublicPath("/settings")).toBe(false)
    expect(isPublicPath("/")).toBe(false)
  })
})

describe("parseVoyantSubdomain", () => {
  describe("production hostnames", () => {
    it("parses booking subdomain", () => {
      const result = parseVoyantSubdomain("acme.booking.voyantcloud.app")
      expect(result).toEqual({ type: "booking", slug: "acme", isLocal: false })
    })

    it("parses customer subdomain", () => {
      const result = parseVoyantSubdomain("acme.customer.voyantcloud.app")
      expect(result).toEqual({ type: "customer", slug: "acme", isLocal: false })
    })

    it("is case-insensitive", () => {
      const result = parseVoyantSubdomain("ACME.Booking.VoyantCloud.App")
      expect(result).toEqual({ type: "booking", slug: "acme", isLocal: false })
    })

    it("strips port from hostname", () => {
      const result = parseVoyantSubdomain("acme.booking.voyantcloud.app:443")
      expect(result).toEqual({ type: "booking", slug: "acme", isLocal: false })
    })

    it("allows hyphens in slug", () => {
      const result = parseVoyantSubdomain("my-company.booking.voyantcloud.app")
      expect(result).toEqual({ type: "booking", slug: "my-company", isLocal: false })
    })

    it("rejects double-hyphens in slug", () => {
      expect(parseVoyantSubdomain("my--company.booking.voyantcloud.app")).toBeNull()
    })
  })

  describe("local hostnames", () => {
    it("parses booking subdomain on localhost", () => {
      const result = parseVoyantSubdomain("acme.booking.localhost")
      expect(result).toEqual({ type: "booking", slug: "acme", isLocal: true })
    })

    it("parses customer subdomain on localhost", () => {
      const result = parseVoyantSubdomain("acme.customer.localhost")
      expect(result).toEqual({ type: "customer", slug: "acme", isLocal: true })
    })

    it("strips port from localhost hostname", () => {
      const result = parseVoyantSubdomain("acme.customer.localhost:3000")
      expect(result).toEqual({ type: "customer", slug: "acme", isLocal: true })
    })

    it("rejects double-hyphens in local slug", () => {
      expect(parseVoyantSubdomain("my--co.booking.localhost")).toBeNull()
    })
  })

  describe("invalid hostnames", () => {
    it("returns null for plain hostname", () => {
      expect(parseVoyantSubdomain("localhost")).toBeNull()
    })

    it("returns null for unrelated domain", () => {
      expect(parseVoyantSubdomain("example.com")).toBeNull()
    })

    it("returns null for invalid subdomain type", () => {
      expect(parseVoyantSubdomain("acme.admin.voyantcloud.app")).toBeNull()
    })

    it("returns null for empty string", () => {
      expect(parseVoyantSubdomain("")).toBeNull()
    })
  })
})

describe("attachOrganizationHeaders", () => {
  it("sets x-site-id when siteId is provided", () => {
    const headers = new Headers()
    attachOrganizationHeaders(headers, { siteId: "site-123" })
    expect(headers.get("x-site-id")).toBe("site-123")
  })

  it("sets x-organization-type when organizationType is provided", () => {
    const headers = new Headers()
    attachOrganizationHeaders(headers, { organizationType: "live" })
    expect(headers.get("x-organization-type")).toBe("live")
  })

  it("sets both headers when both are provided", () => {
    const headers = new Headers()
    attachOrganizationHeaders(headers, { siteId: "site-456", organizationType: "sandbox" })
    expect(headers.get("x-site-id")).toBe("site-456")
    expect(headers.get("x-organization-type")).toBe("sandbox")
  })

  it("does not set headers for empty context", () => {
    const headers = new Headers()
    attachOrganizationHeaders(headers, {})
    expect(headers.get("x-site-id")).toBeNull()
    expect(headers.get("x-organization-type")).toBeNull()
  })

  it("does not set organizationType for null value", () => {
    const headers = new Headers()
    attachOrganizationHeaders(headers, { organizationType: null })
    expect(headers.get("x-organization-type")).toBeNull()
  })
})
