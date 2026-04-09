import { createMiddleware, createServerFn } from "@tanstack/react-start"

export type CurrentUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  isSuperAdmin: boolean
  isSupportUser: boolean
  createdAt: string
  profilePictureUrl?: string | null
  activeOrganizationId?: string | null
}

const withRequest = createMiddleware({ type: "request" }).server(({ next, request }) => {
  return next({ context: { request } })
})

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([withRequest])
  .handler(async ({ context }) => {
    const headers = new Headers()
    const cookie = context.request.headers.get("cookie")

    if (cookie) {
      headers.set("cookie", cookie)
    }

    const response = await fetch(new URL("/api/auth/me", context.request.url), {
      headers,
      method: "GET",
    })

    if (response.status === 401) {
      return null
    }

    if (!response.ok) {
      throw new Error("Failed to fetch current user")
    }

    return (await response.json()) as CurrentUser
  })

export function getCurrentUserQueryOptions(initialUser?: CurrentUser | null) {
  return {
    queryKey: ["current-user"] as const,
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...(initialUser !== undefined ? { initialData: initialUser } : {}),
  }
}
