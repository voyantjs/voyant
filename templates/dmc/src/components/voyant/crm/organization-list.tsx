"use client"

import { type OrganizationRecord, useOrganizations } from "@voyantjs/crm-react"
import { formatMessage } from "@voyantjs/voyant-admin"
import { Loader2, Plus, Search } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminMessages } from "@/lib/admin-i18n"

import { OrganizationDialog } from "./organization-dialog"

export interface OrganizationListProps {
  pageSize?: number
  onSelectOrganization?: (organization: OrganizationRecord) => void
}

function formatRelative(
  value: string,
  messages: ReturnType<typeof useAdminMessages>["organizationsModule"],
): string {
  const timestamp = new Date(value)
  const diff = Date.now() - timestamp.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 1) return messages.updatedToday
  if (days < 7) return formatMessage(messages.updatedDaysAgo, { count: String(days) })
  if (days < 30)
    return formatMessage(messages.updatedWeeksAgo, { count: String(Math.floor(days / 7)) })
  if (days < 365)
    return formatMessage(messages.updatedMonthsAgo, { count: String(Math.floor(days / 30)) })
  return formatMessage(messages.updatedYearsAgo, { count: String(Math.floor(days / 365)) })
}

export function OrganizationList({
  pageSize = 25,
  onSelectOrganization,
}: OrganizationListProps = {}) {
  const messages = useAdminMessages().organizationsModule
  const [search, setSearch] = React.useState("")
  const [offset, setOffset] = React.useState(0)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<OrganizationRecord | undefined>(undefined)

  const { data, isPending, isError } = useOrganizations({
    search: search || undefined,
    limit: pageSize,
    offset,
  })

  const organizations = data?.data ?? []
  const total = data?.total ?? 0
  const page = Math.floor(offset / pageSize) + 1
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const relationLabels: Record<NonNullable<OrganizationRecord["relation"]>, string> = {
    client: messages.relationClient,
    partner: messages.relationPartner,
    supplier: messages.relationSupplier,
    other: messages.relationOther,
  }

  const handleEdit = (organization: OrganizationRecord) => {
    if (onSelectOrganization) {
      onSelectOrganization(organization)
      return
    }
    setEditing(organization)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }

  return (
    <div data-slot="organization-list" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder={messages.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0)
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreate} data-slot="organization-list-create">
          <Plus className="mr-2 size-4" aria-hidden="true" />
          {messages.newAction}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{messages.columnName}</TableHead>
              <TableHead>{messages.columnIndustry}</TableHead>
              <TableHead>{messages.columnRelation}</TableHead>
              <TableHead>{messages.columnWebsite}</TableHead>
              <TableHead>{messages.columnUpdated}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2
                    className="mx-auto size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-destructive">
                  {messages.loadFailed}
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  {messages.empty}
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((organization) => (
                <TableRow
                  key={organization.id}
                  onClick={() => handleEdit(organization)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{organization.name}</TableCell>
                  <TableCell>{organization.industry ?? messages.noValue}</TableCell>
                  <TableCell>
                    {organization.relation ? (
                      <Badge variant="secondary" className="capitalize">
                        {relationLabels[organization.relation] ?? organization.relation}
                      </Badge>
                    ) : (
                      messages.noValue
                    )}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    {organization.website ? (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {organization.website}
                      </a>
                    ) : (
                      messages.noValue
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelative(organization.updatedAt, messages)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {formatMessage(messages.showingSummary, {
            count: String(organizations.length),
            total: String(total),
          })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.max(0, prev - pageSize))}
          >
            {messages.previous}
          </Button>
          <span>
            {formatMessage(messages.pageSummary, {
              page: String(page),
              pageCount: String(pageCount),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + pageSize >= total}
            onClick={() => setOffset((prev) => prev + pageSize)}
          >
            {messages.next}
          </Button>
        </div>
      </div>

      <OrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organization={editing}
        onSuccess={(organization) => {
          if (onSelectOrganization) {
            onSelectOrganization(organization)
          }
        }}
      />
    </div>
  )
}
