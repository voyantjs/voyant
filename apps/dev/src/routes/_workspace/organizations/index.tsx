import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  type CreateOrganizationInput,
  type OrganizationRecord,
  useOrganizationMutation,
  useOrganizations,
} from "@voyantjs/crm-react"
import { Loader2, Plus, Search } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Input } from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatRelative } from "../_crm/_components/crm-constants"

export const Route = createFileRoute("/_workspace/organizations/")({
  component: OrganizationsPage,
})

function OrganizationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)
  const pageSize = 25
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isPending, isError } = useOrganizations({
    search: search || undefined,
    limit: pageSize,
    offset,
  })

  const orgs = data?.data ?? []
  const total = data?.total ?? 0
  const page = Math.floor(offset / pageSize) + 1
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Companies, partners, and accounts in your CRM.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search organizations…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0)
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" aria-hidden="true" />
          New organization
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Updated</TableHead>
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
                  Failed to load organizations.
                </TableCell>
              </TableRow>
            ) : orgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              orgs.map((org: OrganizationRecord) => (
                <TableRow
                  key={org.id}
                  onClick={() =>
                    void navigate({ to: "/organizations/$id", params: { id: org.id } })
                  }
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.industry ?? "—"}</TableCell>
                  <TableCell>
                    {org.relation ? (
                      <Badge variant="secondary" className="capitalize">
                        {org.relation}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    {org.website ? (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {org.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelative(org.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {orgs.length} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.max(0, prev - pageSize))}
          >
            Previous
          </Button>
          <span>
            Page {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + pageSize >= total}
            onClick={() => setOffset((prev) => prev + pageSize)}
          >
            Next
          </Button>
        </div>
      </div>

      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(org) => {
          setDialogOpen(false)
          void navigate({ to: "/organizations/$id", params: { id: org.id } })
        }}
      />
    </div>
  )
}

function CreateOrganizationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  onCreated: (org: OrganizationRecord) => void
}) {
  const { create } = useOrganizationMutation()
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [industry, setIndustry] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    setError(null)
    const input: CreateOrganizationInput = {
      name: name.trim(),
      website: website.trim() || null,
      industry: industry.trim() || null,
    }
    try {
      const org = await create.mutateAsync(input)
      setName("")
      setWebsite("")
      setIndustry("")
      onCreated(org)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
          <DialogDescription>Create a new company account.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="org-name">
              Name
            </label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="org-website">
              Website
            </label>
            <Input
              id="org-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acme.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="org-industry">
              Industry
            </label>
            <Input
              id="org-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Travel"
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
