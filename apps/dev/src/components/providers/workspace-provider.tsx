"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { CurrentWorkspace, WorkspaceOrganization } from "@/lib/current-workspace"

type WorkspaceContextValue = {
  activeOrganization: WorkspaceOrganization | null
  organizations: WorkspaceOrganization[]
  isSwitchingOrganization: boolean
  setActiveOrganization: (organizationId: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

type WorkspaceProviderProps = {
  initialWorkspace: CurrentWorkspace
  children: ReactNode
}

export function WorkspaceProvider({ initialWorkspace, children }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [isSwitchingOrganization, setIsSwitchingOrganization] = useState(false)

  const setActiveOrganization = useCallback(async (organizationId: string) => {
    setIsSwitchingOrganization(true)

    try {
      const response = await fetch("/api/auth/workspace/active-organization", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? "Failed to switch organization")
      }

      setWorkspace((await response.json()) as CurrentWorkspace)
    } finally {
      setIsSwitchingOrganization(false)
    }
  }, [])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      activeOrganization: workspace.activeOrganization,
      organizations: workspace.organizations,
      isSwitchingOrganization,
      setActiveOrganization,
    }),
    [
      isSwitchingOrganization,
      setActiveOrganization,
      workspace.activeOrganization,
      workspace.organizations,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }

  return context
}
