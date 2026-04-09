import { createFileRoute, Outlet } from "@tanstack/react-router"
import { VoyantReactProvider } from "@voyantjs/react"
import { Loader2 } from "lucide-react"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { UserProvider, useUser } from "@/components/providers/user-provider"
import { SidebarProvider } from "@/components/ui"
import { authClient } from "@/lib/auth"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  return (
    <VoyantReactProvider baseUrl={getApiUrl()}>
      <UserProvider>
        <WorkspaceContent />
      </UserProvider>
    </VoyantReactProvider>
  )
}

function WorkspaceContent() {
  const { user, isLoading } = useUser()
  const { data: orgList, isPending: orgsLoading } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()

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

  // No orgs → redirect to onboarding
  if (!orgList || orgList.length === 0) {
    if (typeof window !== "undefined") {
      window.location.href = "/onboarding"
    }
    return null
  }

  // Orgs exist but none active → set first org as active
  if (!activeOrg && orgList.length > 0) {
    const firstOrg = orgList[0]
    if (firstOrg) {
      void authClient.organization.setActive({ organizationId: firstOrg.id })
    }
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
