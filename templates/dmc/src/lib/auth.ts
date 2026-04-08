"use client"

import { apiKeyClient } from "@better-auth/api-key/client"
import { emailOTPClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { useCallback } from "react"

import { getApiUrl } from "./env"

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/auth",
  plugins: [apiKeyClient(), organizationClient(), emailOTPClient()],
  fetchOptions: {
    credentials: "include",
  },
})

export function useAuth() {
  const { data, isPending } = authClient.useSession()

  return {
    isLoaded: !isPending,
    isSignedIn: Boolean(data?.user),
    userId: data?.user?.id ?? null,
  }
}

export function useUser() {
  const { data, isPending } = authClient.useSession()

  const user = data?.user
    ? {
        id: data.user.id,
        firstName: data.user.name?.split(" ")[0] ?? null,
        lastName: data.user.name?.split(" ").slice(1).join(" ") || null,
        email: data.user.email ?? "",
        imageUrl: null as string | null,
      }
    : null

  return {
    isLoaded: !isPending,
    isSignedIn: Boolean(data?.user),
    user,
  }
}

export function useSignOut() {
  return useCallback(async (options?: { redirectTo?: string }) => {
    await authClient.signOut()
    if (typeof window !== "undefined") {
      window.location.href = options?.redirectTo ?? "/sign-in"
    }
  }, [])
}
