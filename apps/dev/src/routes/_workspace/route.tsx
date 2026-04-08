import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { useUser } from "@/components/providers/user-provider"
import { SidebarProvider } from "@/components/ui"

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { user, isLoading } = useUser()

  if (isLoading) {
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
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
