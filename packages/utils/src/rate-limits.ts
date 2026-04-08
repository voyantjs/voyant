/**
 * Rate Limit Utilities
 *
 * Maps subscription plans to API rate limits
 */

export interface RateLimitConfig {
  rps: number // Requests per second
  rpm: number // Requests per minute
  burst?: number // Burst allowance
}

/**
 * Default rate limits by plan tier
 *
 * These limits apply to API key authentication
 * Based on subscription tier or plan key
 */
export const RATE_LIMITS_BY_PLAN: Record<string, RateLimitConfig> = {
  // Free/Starter tier
  free: {
    rps: 5,
    rpm: 300,
    burst: 10,
  },
  starter: {
    rps: 5,
    rpm: 300,
    burst: 10,
  },

  // Professional tier
  professional: {
    rps: 50,
    rpm: 3000,
    burst: 100,
  },
  pro: {
    rps: 50,
    rpm: 3000,
    burst: 100,
  },

  // Business tier
  business: {
    rps: 100,
    rpm: 6000,
    burst: 200,
  },

  // Enterprise tier
  enterprise: {
    rps: 500,
    rpm: 30000,
    burst: 1000,
  },

  // Default fallback
  default: {
    rps: 5,
    rpm: 300,
    burst: 10,
  },
}

/**
 * Get rate limits for a given plan key
 *
 * @param planKey - The plan key (e.g., "starter", "professional", "enterprise")
 * @returns Rate limit configuration
 */
export function getRateLimitsForPlan(planKey: string | null | undefined): RateLimitConfig {
  if (!planKey) return RATE_LIMITS_BY_PLAN.default!

  const normalized = planKey.toLowerCase().trim()
  return RATE_LIMITS_BY_PLAN[normalized] || RATE_LIMITS_BY_PLAN.default!
}

/**
 * Check if a plan has enterprise-level access
 *
 * @param planKey - The plan key
 * @returns True if enterprise plan
 */
export function isEnterprisePlan(planKey: string | null | undefined): boolean {
  if (!planKey) return false
  return planKey.toLowerCase().includes("enterprise")
}

/**
 * Get human-readable rate limit description
 *
 * @param limits - Rate limit configuration
 * @returns Formatted string
 */
export function describeRateLimits(limits: RateLimitConfig): string {
  return `${limits.rpm} requests/minute, ${limits.rps} requests/second`
}
