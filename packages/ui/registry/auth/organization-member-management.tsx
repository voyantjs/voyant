"use client"

import {
  type OrganizationInvitation,
  type OrganizationMember,
  useCurrentWorkspace,
  useOrganizationInvitationMutation,
  useOrganizationInvitations,
  useOrganizationMemberMutation,
  useOrganizationMembers,
} from "@voyantjs/auth-react"
import { Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface OrganizationMemberManagementProps {
  organizationId?: string
  availableRoles?: string[]
  defaultInviteRole?: string
  allowInvite?: boolean
  allowRoleChange?: boolean
  allowRemove?: boolean
  allowCancelInvitation?: boolean
}

function getPrimaryRole(value: OrganizationMember["role"] | OrganizationInvitation["role"]) {
  return Array.isArray(value) ? (value[0] ?? "member") : value
}

function formatRole(value: OrganizationMember["role"] | OrganizationInvitation["role"]) {
  return Array.isArray(value) ? value.join(", ") : value
}

function formatExpiry(value: string) {
  return new Date(value).toLocaleDateString()
}

export function OrganizationMemberManagement({
  organizationId,
  availableRoles = ["owner", "admin", "member"],
  defaultInviteRole = availableRoles[availableRoles.length - 1] ?? "member",
  allowInvite = true,
  allowRoleChange = true,
  allowRemove = true,
  allowCancelInvitation = true,
}: OrganizationMemberManagementProps = {}) {
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState(defaultInviteRole)
  const [inviteError, setInviteError] = React.useState<string | null>(null)
  const { data: workspace, isPending: workspacePending } = useCurrentWorkspace()
  const resolvedOrganizationId = organizationId ?? workspace?.activeOrganization?.id ?? undefined

  const membersQuery = useOrganizationMembers({
    enabled: Boolean(resolvedOrganizationId),
    filters: resolvedOrganizationId ? { organizationId: resolvedOrganizationId } : undefined,
  })
  const invitationsQuery = useOrganizationInvitations({
    enabled: Boolean(resolvedOrganizationId),
    filters: resolvedOrganizationId ? { organizationId: resolvedOrganizationId } : undefined,
  })
  const { updateRole, remove } = useOrganizationMemberMutation()
  const { invite, cancel } = useOrganizationInvitationMutation()

  React.useEffect(() => {
    setInviteRole(defaultInviteRole)
  }, [defaultInviteRole])

  const members = membersQuery.data?.members ?? []
  const invitations = invitationsQuery.data ?? []
  const isLoading = workspacePending || (resolvedOrganizationId && membersQuery.isPending)

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setInviteError(null)

    if (!resolvedOrganizationId) {
      setInviteError("No active organization selected.")
      return
    }

    if (!inviteEmail.trim()) {
      setInviteError("Email is required.")
      return
    }

    try {
      await invite.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: resolvedOrganizationId,
      })
      setInviteEmail("")
      setInviteRole(defaultInviteRole)
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to send invitation.")
    }
  }

  return (
    <Card data-slot="organization-member-management">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" aria-hidden="true" />
            Team members
          </CardTitle>
          <CardDescription>
            Manage organization members and pending invitations from the shared auth contract.
          </CardDescription>
        </div>
        {workspace?.activeOrganization ? (
          <Badge variant="secondary">{workspace.activeOrganization.name}</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {allowInvite ? (
          <form onSubmit={handleInvite} className="grid gap-3 rounded-md border p-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="organization-member-management-email">Invite by email</Label>
              <Input
                id="organization-member-management-email"
                type="email"
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                disabled={!resolvedOrganizationId || invite.isPending}
              />
            </div>
            <div>
              <Label htmlFor="organization-member-management-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={setInviteRole}
                disabled={!resolvedOrganizationId || invite.isPending}
              >
                <SelectTrigger id="organization-member-management-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={!resolvedOrganizationId || invite.isPending}
              >
                {invite.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus className="mr-2 size-4" aria-hidden="true" />
                )}
                Invite
              </Button>
            </div>
            {inviteError ? (
              <p className="text-sm text-destructive sm:col-span-4">{inviteError}</p>
            ) : null}
          </form>
        ) : null}

        {!resolvedOrganizationId ? (
          <p className="rounded-md border px-4 py-6 text-sm text-muted-foreground">
            Select an organization to manage members.
          </p>
        ) : isLoading ? (
          <div className="flex min-h-24 items-center justify-center rounded-md border">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-sm text-muted-foreground"
                      >
                        No members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {member.user.name || member.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {member.user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {allowRoleChange ? (
                            <Select
                              value={getPrimaryRole(member.role)}
                              onValueChange={(role) =>
                                void updateRole.mutateAsync({
                                  memberId: member.id,
                                  organizationId: resolvedOrganizationId,
                                  role,
                                })
                              }
                              disabled={updateRole.isPending}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{formatRole(member.role)}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatExpiry(member.createdAt)}
                        </TableCell>
                        <TableCell>
                          {allowRemove ? (
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={remove.isPending}
                                onClick={() => {
                                  if (
                                    confirm(`Remove ${member.user.email} from this organization?`)
                                  ) {
                                    void remove.mutateAsync({
                                      memberIdOrEmail: member.user.email,
                                      organizationId: resolvedOrganizationId,
                                    })
                                  }
                                }}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pending invitations</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-sm text-muted-foreground"
                      >
                        No pending invitations.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                            <span>{invitation.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatRole(invitation.role)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatExpiry(invitation.expiresAt)}
                        </TableCell>
                        <TableCell>
                          {allowCancelInvitation ? (
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={cancel.isPending}
                                onClick={() =>
                                  void cancel.mutateAsync({ invitationId: invitation.id })
                                }
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
