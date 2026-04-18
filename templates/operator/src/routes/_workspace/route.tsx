import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { VoyantReactProvider } from "@voyantjs/react"
import { useLocale } from "@voyantjs/voyant-admin"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { UserProvider, useUser } from "@/components/providers/user-provider"
import { WorkspaceProvider } from "@/components/providers/workspace-provider"
import { SidebarProvider } from "@/components/ui"
import { useAdminMessages } from "@/lib/admin-i18n"
import { getCurrentUser } from "@/lib/current-user"
import { getCurrentWorkspace } from "@/lib/current-workspace"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace")({
  loader: async ({ location }) => {
    const user = await getCurrentUser()

    if (!user) {
      throw redirect({
        to: "/sign-in",
        search: { next: location.href },
      })
    }

    const workspace = await getCurrentWorkspace()

    if (!workspace?.activeOrganization) {
      throw new Error("Failed to resolve active workspace organization")
    }

    return { user, workspace }
  },
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { user, workspace } = Route.useLoaderData()

  return (
    <VoyantReactProvider baseUrl={getApiUrl()}>
      <UserProvider initialUser={user}>
        <WorkspaceProvider initialWorkspace={workspace}>
          <WorkspaceContent />
        </WorkspaceProvider>
      </UserProvider>
    </VoyantReactProvider>
  )
}

function WorkspaceContent() {
  const { user, isLoading } = useUser()
  const { setLocale, setTimeZone } = useLocale()
  const messages = useAdminMessages()

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return
    }

    if (!window.localStorage.getItem("admin-locale") && user.locale) {
      setLocale(user.locale)
    }

    if (!window.localStorage.getItem("admin-timezone") && user.timezone) {
      setTimeZone(user.timezone)
    }
  }, [setLocale, setTimeZone, user])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{messages.loading}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
