import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { z } from "zod"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui"

import { useInviteInfo, useRedeemInvite } from "@/hooks/use-invite-tokens"
import { authClient } from "@/lib/auth"

export const Route = createFileRoute("/(auth)/accept-invite")({
  validateSearch: z.object({
    token: z.string(),
  }),
  component: AcceptInvitePage,
})

function AcceptInvitePage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const { data: invite, isLoading: inviteLoading, error: inviteError } = useInviteInfo(token)
  const redeemMutation = useRedeemInvite(token)

  const [redeemed, setRedeemed] = useState(false)

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      const returnUrl = `/accept-invite?token=${encodeURIComponent(token)}`
      window.location.href = `/sign-in?next=${encodeURIComponent(returnUrl)}`
    }
  }, [sessionLoading, session?.user, token])

  const handleAccept = () => {
    redeemMutation.mutate(undefined, {
      onSuccess: () => {
        setRedeemed(true)
        setTimeout(() => navigate({ to: "/" }), 1500)
      },
    })
  }

  if (sessionLoading || inviteLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (inviteError || !invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid invite</CardTitle>
          <CardDescription>
            This invite link is invalid, expired, or has already been used.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (redeemed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite accepted</CardTitle>
          <CardDescription>
            You now have access to {invite.operatorName}. Redirecting...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept operator invite</CardTitle>
        <CardDescription>
          You have been invited to access <strong>{invite.operatorName}</strong>
          {invite.label ? ` as ${invite.label}` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground mb-2">Granted permissions:</p>
          <div className="flex flex-wrap gap-1">
            {invite.scopes.map((scope) => (
              <Badge key={scope} variant="secondary" className="text-xs">
                {scope}
              </Badge>
            ))}
          </div>
          {invite.expiresAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Expires: {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {redeemMutation.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {redeemMutation.error.message}
          </div>
        )}

        <Button onClick={handleAccept} className="w-full" disabled={redeemMutation.isPending}>
          {redeemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Accept invite
        </Button>
      </CardContent>
    </Card>
  )
}
