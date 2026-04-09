import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { UserProvider, useUser } from "@/components/providers/user-provider"
import { SidebarProvider } from "@/components/ui"
import { authClient } from "@/lib/auth"

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  return (
    <UserProvider>
      <WorkspaceContent />
    </UserProvider>
  )
}

function WorkspaceContent() {
  const { user, isLoading } = useUser()
  const { data: orgList, isPending: orgsLoading } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const creatingOrg = useRef(false)

  // Auto-create a default organization if none exist (single-tenant)
  useEffect(() => {
    if (!user || orgsLoading || creatingOrg.current) return
    if (orgList && orgList.length === 0) {
      creatingOrg.current = true
      void authClient.organization
        .create({ name: "My Organization", slug: "default" })
        .then((res) => {
          if (res.data) {
            void authClient.organization.setActive({ organizationId: res.data.id })
          }
        })
        .finally(() => {
          creatingOrg.current = false
        })
    }
  }, [user, orgList, orgsLoading])

  if (isLoading || orgsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== "undefined") {
      const next = window.location.pathname
      window.location.href = `/sign-in?next=${encodeURIComponent(next)}`
    }
    return null
  }

  // Still waiting for org to be created/activated
  if (!orgList || orgList.length === 0 || !activeOrg) {
    // Orgs exist but none active → set first org as active
    if (orgList && orgList.length > 0 && !activeOrg) {
      const firstOrg = orgList[0]
      if (firstOrg) {
        void authClient.organization.setActive({ organizationId: firstOrg.id })
      }
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Setting up workspace...</p>
        </div>
      </div>
    )
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ")

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: displayName,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          email: user.email,
          avatar: user.profilePictureUrl ?? undefined,
        }}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
