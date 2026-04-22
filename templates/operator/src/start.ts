import { createStart } from "@tanstack/react-start"

/**
 * Disable server-side execution of route loaders and components by default.
 *
 * The admin dashboard is auth-gated and all API calls rely on the session
 * cookie. Server-side fetches via the Voyant react packages' default fetcher
 * can't forward browser cookies, so SSR loaders would 401 and render the
 * error boundary. Running loaders on the client during hydration sidesteps
 * this entirely; the HTML shell still SSRs, and each ssr:false route's
 * pendingComponent renders as the SSR fallback.
 */
export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
