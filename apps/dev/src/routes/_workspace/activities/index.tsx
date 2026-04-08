import { createFileRoute } from "@tanstack/react-router"
import {
  type ActivityRecord,
  type CreateActivityInput,
  useActivities,
  useActivityMutation,
} from "@voyantjs/voyant-crm-ui"
import { Loader2, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  formatDate,
  formatRelative,
} from "../_crm/_components/crm-constants"

export const Route = createFileRoute("/_workspace/activities/")({
  component: ActivitiesPage,
})

function ActivitiesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isPending } = useActivities({
    type: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  })

  const activities = data?.data ?? []

  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityRecord[]>()
    for (const a of activities) {
      const day = new Date(a.createdAt).toDateString()
      const bucket = groups.get(day)
      if (bucket) bucket.push(a)
      else groups.set(day, [a])
    }
    return Array.from(groups.entries())
  }, [activities])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="text-sm text-muted-foreground">
            Calls, emails, meetings, tasks, and follow-ups across your CRM.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          New activity
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ACTIVITY_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ACTIVITY_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <Card className="flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
          No activities match your filters.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([day, rows]) => (
            <Card key={day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {formatDate(rows[0]?.createdAt ?? null)} ({rows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {rows.map((a) => (
                    <li key={a.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.subject}</p>
                          {a.description ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {a.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="capitalize">
                              {a.type}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {a.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelative(a.createdAt)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateActivityDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

function CreateActivityDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  const { create, addLink } = useActivityMutation()
  const [subject, setSubject] = useState("")
  const [type, setType] = useState<string>("note")
  const [status, setStatus] = useState<string>("planned")
  const [description, setDescription] = useState("")
  const [entityType, setEntityType] = useState<string>("none")
  const [entityId, setEntityId] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!subject.trim()) {
      setError("Subject is required")
      return
    }
    setError(null)
    const input: CreateActivityInput = {
      subject: subject.trim(),
      type,
      status,
      description: description.trim() || null,
    }
    try {
      const activity = await create.mutateAsync(input)
      if (entityType !== "none" && entityId.trim()) {
        await addLink.mutateAsync({
          activityId: activity.id,
          input: {
            entityType,
            entityId: entityId.trim(),
            role: "primary",
          },
        })
      }
      setSubject("")
      setDescription("")
      setEntityType("none")
      setEntityId("")
      setType("note")
      setStatus("planned")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create activity")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New activity</DialogTitle>
          <DialogDescription>Log a call, email, meeting, or task.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="act-subject">
              Subject
            </label>
            <Input
              id="act-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Discovery call with Acme"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <Select value={type} onValueChange={(v) => setType(v ?? "note")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "planned")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="act-desc">
              Description
            </label>
            <Textarea
              id="act-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Link to</span>
              <Select value={entityType} onValueChange={(v) => setEntityType(v ?? "none")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="opportunity">Opportunity</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground" htmlFor="act-entity">
                Entity ID
              </label>
              <Input
                id="act-entity"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                disabled={entityType === "none"}
                placeholder="prsn_…"
              />
            </div>
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
