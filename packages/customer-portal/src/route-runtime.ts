export type PublicCustomerPortalRouteRuntime = {
  resolveDocumentDownloadUrl?: (storageKey: string) => Promise<string | null> | string | null
}

export const CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY =
  "providers.customerPortal.public.runtime"

export interface PublicCustomerPortalRuntimeOptions {
  resolveDocumentDownloadUrl?: (
    bindings: unknown,
    storageKey: string,
  ) => Promise<string | null> | string | null
}

export function buildPublicCustomerPortalRouteRuntime(
  bindings: unknown,
  options: PublicCustomerPortalRuntimeOptions = {},
): PublicCustomerPortalRouteRuntime {
  const resolveDocumentDownloadUrl = options.resolveDocumentDownloadUrl
    ? (storageKey: string) => options.resolveDocumentDownloadUrl?.(bindings, storageKey) ?? null
    : undefined

  return {
    resolveDocumentDownloadUrl,
  }
}
