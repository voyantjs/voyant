import { z } from "zod"

/**
 * API Key Scope Definitions
 *
 * Following resource:action pattern similar to Stripe/Shopify
 * Format: "{resource}:{action}" or wildcards
 */

// Resource types
export const API_KEY_RESOURCES = [
  "operators",
  "connections",
  "oauth-clients",
  "products",
  "availability",
  "bookings",
  "suppliers",
  "grants",
  "audit-logs",
] as const

export type ApiKeyResource = (typeof API_KEY_RESOURCES)[number]

// Action types
export const API_KEY_ACTIONS = ["read", "write", "delete"] as const

export type ApiKeyAction = (typeof API_KEY_ACTIONS)[number]

/**
 * Valid scope patterns:
 * - Specific: "operators:read", "connections:write"
 * - Resource wildcard: "operators:*" (all actions on operators)
 * - Action wildcard: "*:read" (read all resources)
 * - Full wildcard: "*" (all resources, all actions)
 */
export const VALID_SCOPES = [
  // Operators
  "operators:read",
  "operators:write",
  "operators:delete",
  "operators:*",

  // Connections
  "connections:read",
  "connections:write",
  "connections:delete",
  "connections:*",

  // OAuth Clients
  "oauth-clients:read",
  "oauth-clients:write",
  "oauth-clients:delete",
  "oauth-clients:*",

  // Products
  "products:read",
  "products:*",

  // Availability
  "availability:read",
  "availability:*",

  // Bookings
  "bookings:read",
  "bookings:write",
  "bookings:delete",
  "bookings:*",

  // Suppliers
  "suppliers:read",
  "suppliers:*",

  // Grants
  "grants:read",
  "grants:write",
  "grants:delete",
  "grants:*",

  // Audit Logs
  "audit-logs:read",
  "audit-logs:*",

  // Wildcard patterns
  "*:read", // Read-only access to all resources
  "*:write", // Write access to all resources
  "*:delete", // Delete access to all resources
  "*", // Full access (God mode)
] as const

export type ApiKeyScope = (typeof VALID_SCOPES)[number]

// Zod schema for scope validation
export const apiKeyScopeSchema = z.enum(VALID_SCOPES)

export const apiKeyScopesSchema = z.array(apiKeyScopeSchema).default([])

/**
 * Scope groups for UI display
 * Grouped by resource for nested checkbox UX
 */
export const SCOPE_GROUPS = {
  operators: {
    label: "Operators",
    description: "Manage operator registrations and configuration",
    scopes: ["operators:read", "operators:write", "operators:delete"],
  },
  connections: {
    label: "Connections",
    description: "Manage supplier connections and credentials",
    scopes: ["connections:read", "connections:write", "connections:delete"],
  },
  "oauth-clients": {
    label: "OAuth Clients",
    description: "Manage OAuth client credentials for M2M access",
    scopes: ["oauth-clients:read", "oauth-clients:write", "oauth-clients:delete"],
  },
  products: {
    label: "Products",
    description: "Query supplier product catalogs via OCTO",
    scopes: ["products:read"],
  },
  availability: {
    label: "Availability",
    description: "Query supplier availability via OCTO",
    scopes: ["availability:read"],
  },
  bookings: {
    label: "Bookings",
    description: "Create, confirm, and cancel bookings via OCTO",
    scopes: ["bookings:read", "bookings:write", "bookings:delete"],
  },
  suppliers: {
    label: "Suppliers",
    description: "Query supplier information via OCTO",
    scopes: ["suppliers:read"],
  },
  grants: {
    label: "Grants",
    description: "Manage cross-organization operator access grants",
    scopes: ["grants:read", "grants:write", "grants:delete"],
  },
  "audit-logs": {
    label: "Audit Logs",
    description: "Query API audit logs for your organization",
    scopes: ["audit-logs:read"],
  },
} as const

export type ScopeGroupKey = keyof typeof SCOPE_GROUPS

/**
 * Predefined scope templates for quick setup
 */
interface ScopeTemplate {
  name: string
  description: string
  scopes: ApiKeyScope[]
}

export const SCOPE_TEMPLATES: Record<string, ScopeTemplate> = {
  "read-only": {
    name: "Read Only",
    description: "Read-only access to all resources",
    scopes: ["*:read"],
  },
  "full-access": {
    name: "Full Access",
    description: "Complete access to all resources and actions",
    scopes: ["*"],
  },
  "operator-admin": {
    name: "Operator Admin",
    description: "Full operator and connection management",
    scopes: ["operators:*", "connections:*", "oauth-clients:*"],
  },
  reseller: {
    name: "OCTO Reseller",
    description: "Full data-plane access for resellers",
    scopes: [
      "products:read",
      "availability:read",
      "bookings:read",
      "bookings:write",
      "bookings:delete",
      "suppliers:read",
    ],
  },
}

export type ScopeTemplateKey = "read-only" | "full-access" | "operator-admin" | "reseller"

/**
 * Expiration presets for key creation
 */
export const EXPIRATION_PRESETS = {
  never: {
    label: "Never",
    days: null,
  },
  "7days": {
    label: "7 days",
    days: 7,
  },
  "30days": {
    label: "30 days",
    days: 30,
  },
  "90days": {
    label: "90 days",
    days: 90,
  },
  "180days": {
    label: "6 months",
    days: 180,
  },
  "365days": {
    label: "1 year",
    days: 365,
  },
  custom: {
    label: "Custom date",
    days: null,
  },
} as const

export type ExpirationPresetKey = keyof typeof EXPIRATION_PRESETS

/**
 * Helper functions for scope validation
 */

/**
 * Check if a scope pattern matches a required scope
 * Handles wildcards: "operators:*", "*:read", "*"
 */
export function scopeMatches(userScope: string, requiredScope: string): boolean {
  // Full wildcard
  if (userScope === "*") return true

  // Exact match
  if (userScope === requiredScope) return true

  const [userResource, userAction] = userScope.split(":")
  const [reqResource, reqAction] = requiredScope.split(":")

  // Resource wildcard (e.g., "operators:*" matches "operators:read")
  if (userResource === reqResource && userAction === "*") return true

  // Action wildcard (e.g., "*:read" matches "operators:read")
  if (userResource === "*" && userAction === reqAction) return true

  return false
}

/**
 * Check if user has all required scopes
 */
export function hasScopes(userScopes: string[], requiredScopes: string[]): boolean {
  return requiredScopes.every((required) =>
    userScopes.some((userScope) => scopeMatches(userScope, required)),
  )
}

/**
 * Get human-readable description of scopes
 */
export function describescopes(scopes: string[]): string {
  if (scopes.includes("*")) {
    return "Full access to all resources"
  }

  if (scopes.includes("*:read") && scopes.length === 1) {
    return "Read-only access to all resources"
  }

  const resources = new Set<string>()
  const actions = new Set<string>()

  for (const scope of scopes) {
    const [resource, action] = scope.split(":")
    if (resource && resource !== "*") resources.add(resource)
    if (action && action !== "*") actions.add(action)
  }

  if (resources.size === 0) {
    return `${actions.size} permission${actions.size > 1 ? "s" : ""}`
  }

  return `${resources.size} resource${resources.size > 1 ? "s" : ""}`
}

/**
 * Calculate expiration date from preset
 */
export function calculateExpirationDate(
  preset: ExpirationPresetKey,
  customDate?: Date,
): Date | null {
  if (preset === "never") return null
  if (preset === "custom") return customDate || null

  const config = EXPIRATION_PRESETS[preset]
  if (!config.days) return null

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.days)
  return expiresAt
}
