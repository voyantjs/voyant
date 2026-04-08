import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { TemplateDialog } from "./_components/template-dialog"
import { TemplateVersionDialog } from "./_components/template-version-dialog"

type ContractTemplate = {
  id: string
  name: string
  slug: string
  scope: string
  language: string
  description: string | null
  bodyFormat: string
  body: string
  variableSchema: Record<string, unknown> | null
  active: boolean
  createdAt: string
}

type TemplateVersion = {
  id: string
  templateId: string
  version: number
  bodyFormat: string
  body: string
  variableSchema: Record<string, unknown> | null
  changelog: string | null
  createdBy: string | null
  createdAt: string
}

type TemplateListResponse = {
  data: ContractTemplate[]
  total: number
  limit: number
  offset: number
}

export const Route = createFileRoute("/_workspace/legal/templates/")({
  component: TemplatesPage,
})

const SCOPES = ["customer", "supplier", "partner", "channel", "other"] as const

function TemplatesPage() {
  const [search, setSearch] = useState("")
  const [scope, setScope] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | undefined>()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [versionDialogTemplateId, setVersionDialogTemplateId] = useState<string>("")

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.legal.templates.list(search),
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (scope !== "all") params.set("scope", scope)
      const qs = params.toString()
      return api.get<TemplateListResponse>(
        `/v1/admin/legal/contracts/templates${qs ? `?${qs}` : ""}`,
      )
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/admin/legal/contracts/templates/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contract Templates</h1>
          <p className="text-sm text-muted-foreground">
            Reusable contract templates with version history.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTemplate(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scopes</SelectItem>
            {SCOPES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && (!data?.data || data.data.length === 0) && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No templates yet. Create one to start building contract templates.
          </p>
        </div>
      )}

      {!isPending && data?.data && data.data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.data.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              expanded={expandedIds.has(template.id)}
              onToggle={() => toggleExpand(template.id)}
              onEdit={() => {
                setEditingTemplate(template)
                setDialogOpen(true)
              }}
              onDelete={() => {
                if (confirm(`Delete template "${template.name}"?`)) {
                  deleteTemplateMutation.mutate(template.id)
                }
              }}
              onAddVersion={() => {
                setVersionDialogTemplateId(template.id)
                setVersionDialogOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingTemplate(undefined)
          void refetch()
        }}
      />

      {versionDialogTemplateId && (
        <TemplateVersionDialog
          open={versionDialogOpen}
          onOpenChange={setVersionDialogOpen}
          templateId={versionDialogTemplateId}
          onSuccess={() => {
            setVersionDialogOpen(false)
            void refetch()
          }}
        />
      )}
    </div>
  )
}

function TemplateRow({
  template,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddVersion,
}: {
  template: ContractTemplate
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddVersion: () => void
}) {
  const { data: versionsData } = useQuery({
    queryKey: queryKeys.legal.templates.versions(template.id),
    queryFn: () =>
      api.get<{ data: TemplateVersion[] }>(
        `/v1/admin/legal/contracts/templates/${template.id}/versions`,
      ),
    enabled: expanded,
  })

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{template.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{template.slug}</span>
            <Badge variant="outline" className="capitalize">
              {template.scope}
            </Badge>
            <Badge variant={template.active ? "default" : "secondary"}>
              {template.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {template.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Versions
            </p>
            <Button variant="outline" size="sm" onClick={onAddVersion}>
              <Plus className="mr-1 h-3 w-3" />
              Add Version
            </Button>
          </div>

          {(!versionsData?.data || versionsData.data.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-2">No versions yet.</p>
          )}

          {versionsData?.data && versionsData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Version</th>
                    <th className="text-left p-2 font-medium">Format</th>
                    <th className="text-left p-2 font-medium">Changelog</th>
                    <th className="text-left p-2 font-medium">Created By</th>
                    <th className="text-left p-2 font-medium">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {versionsData.data.map((v) => (
                    <tr key={v.id} className="border-b last:border-b-0">
                      <td className="p-2 font-mono">v{v.version}</td>
                      <td className="p-2">{v.bodyFormat}</td>
                      <td className="p-2">{v.changelog ?? "-"}</td>
                      <td className="p-2">{v.createdBy ?? "-"}</td>
                      <td className="p-2">{new Date(v.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
