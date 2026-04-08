import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/(auth)")({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Voyant</h1>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
