import { useQuery } from "@tanstack/react-query"
import { createContext, type ReactNode, useContext } from "react"

import { getApiUrl } from "@/lib/env"

export type User = {
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

type UserContextValue = {
  user: User | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/auth/me`, {
        credentials: "include",
      })
      if (!res.ok) {
        if (res.status === 401) return null
        throw new Error("Failed to fetch user")
      }
      return (await res.json()) as User
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })

  const isLoading = isPending || (isFetching && user === undefined)

  return (
    <UserContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error ? error : null,
        refetch,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}
