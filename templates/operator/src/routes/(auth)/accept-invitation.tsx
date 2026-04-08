import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"

import { authClient } from "@/lib/auth"

export const Route = createFileRoute("/(auth)/accept-invitation")({
  validateSearch: z.object({
    id: z.string(),
  }),
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const { data: session, isPending: sessionLoading } = authClient.useSession()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  // If not signed in, redirect to sign-in with return URL
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      const returnUrl = `/accept-invitation?id=${encodeURIComponent(id)}`
      window.location.href = `/sign-in?next=${encodeURIComponent(returnUrl)}`
    }
  }, [sessionLoading, session?.user, id])

  const handleAccept = async () => {
    setError(null)
    setLoading(true)

    try {
      const result = await authClient.organization.acceptInvitation({ invitationId: id })

      if (result.error) {
        setError(result.error.message || "Failed to accept invitation")
        setLoading(false)
        return
      }

      setAccepted(true)
      // Short delay to show success, then redirect
      setTimeout(() => navigate({ to: "/" }), 1500)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (sessionLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (accepted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation accepted</CardTitle>
          <CardDescription>Redirecting to your dashboard...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
        <CardDescription>You have been invited to join an organization on Voyant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <Button onClick={handleAccept} className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Accept invitation
        </Button>
      </CardContent>
    </Card>
  )
}
