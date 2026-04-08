import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  type OpportunityRecord,
  type StageRecord,
  useOpportunities,
  useOpportunityMutation,
  useOrganizations,
  usePeople,
  usePipelineMutation,
  usePipelines,
  useStages,
} from "@voyantjs/voyant-crm-ui"
import { currencies } from "@voyantjs/utils/currencies"
import { Loader2, Plus, Settings2, Trash2, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { formatDate, formatMoney } from "../_crm/_components/crm-constants"

const CURRENCY_CODES = Object.keys(currencies).sort()

export const Route = createFileRoute("/_workspace/opportunities/")({
  component: OpportunitiesKanbanPage,
})

function OpportunitiesKanbanPage() {
  const navigate = useNavigate()
  const pipelinesQuery = usePipelines({ entityType: "opportunity", limit: 50 })
  const pipelines = pipelinesQuery.data?.data ?? []

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [showCreatePipeline, setShowCreatePipeline] = useState(false)
  const [showManageStages, setShowManageStages] = useState(false)
  const [showCreateOpp, setShowCreateOpp] = useState(false)

  useEffect(() => {
    if (!selectedPipelineId && pipelines.length > 0) {
      const def = pipelines.find((p) => p.isDefault) ?? pipelines[0]
      if (def) setSelectedPipelineId(def.id)
    }
  }, [pipelines, selectedPipelineId])

  const stagesQuery = useStages({
    pipelineId: selectedPipelineId ?? undefined,
    limit: 100,
    enabled: Boolean(selectedPipelineId),
  })
  const oppsQuery = useOpportunities({
    pipelineId: selectedPipelineId ?? undefined,
    status: "open",
    limit: 500,
    enabled: Boolean(selectedPipelineId),
  })

  const { update } = useOpportunityMutation()

  const stages = useMemo(
    () => [...(stagesQuery.data?.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [stagesQuery.data],
  )
  const opps = oppsQuery.data?.data ?? []

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeOpp = activeId ? (opps.find((o) => o.id === activeId) ?? null) : null

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const oppId = String(active.id)
    const newStageId = String(over.id)
    const opp = opps.find((o) => o.id === oppId)
    if (!opp || opp.stageId === newStageId) return
    try {
      await update.mutateAsync({ id: oppId, input: { stageId: newStageId } })
    } catch {
      // invalidation will restore server state
    }
  }

  const groupedByStage = useMemo(() => {
    const map = new Map<string, OpportunityRecord[]>()
    for (const stage of stages) map.set(stage.id, [])
    for (const opp of opps) {
      const bucket = map.get(opp.stageId)
      if (bucket) bucket.push(opp)
    }
    return map
  }, [stages, opps])

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            Drag cards between stages to update their status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPipelineId ?? undefined}
            onValueChange={(v) => setSelectedPipelineId(v)}
            disabled={pipelinesQuery.isPending || pipelines.length === 0}
          >
            <SelectTrigger className="w-[200px] text-sm">
              <SelectValue placeholder="Select pipeline…">
                {(value) => {
                  const pipeline = pipelines.find((p) => p.id === value)
                  if (!pipeline) return "Select pipeline…"
                  return `${pipeline.name}${pipeline.isDefault ? " (default)" : ""}`
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.isDefault ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreatePipeline(true)}
            disabled={pipelinesQuery.isPending}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New pipeline
          </Button>
          {selectedPipelineId ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageStages(true)}
                disabled={stagesQuery.isPending}
              >
                <Settings2 className="mr-1.5 h-4 w-4" />
                Manage stages
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateOpp(true)}
                disabled={stagesQuery.isPending || stages.length === 0}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New opportunity
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {pipelinesQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pipelines.length === 0 ? (
        <Card className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">No pipelines configured yet.</p>
          <Button onClick={() => setShowCreatePipeline(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create your first pipeline
          </Button>
        </Card>
      ) : stagesQuery.isPending || oppsQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stages.length === 0 ? (
        <Card className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">This pipeline has no stages.</p>
          <Button onClick={() => setShowManageStages(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add first stage
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="flex-1">
            <div className="flex gap-3 pb-2">
              {stages.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  opportunities={groupedByStage.get(stage.id) ?? []}
                  activeId={activeId}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <DragOverlay>
            {activeOpp ? <OpportunityCard opp={activeOpp} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreatePipelineDialog
        open={showCreatePipeline}
        onOpenChange={setShowCreatePipeline}
        existingCount={pipelines.length}
        onCreated={(pipelineId) => {
          setSelectedPipelineId(pipelineId)
          setShowCreatePipeline(false)
          // open manage stages so the user can seed stages immediately
          setShowManageStages(true)
        }}
      />

      {selectedPipelineId ? (
        <ManageStagesDialog
          open={showManageStages}
          onOpenChange={setShowManageStages}
          pipelineId={selectedPipelineId}
          stages={stages}
        />
      ) : null}

      {selectedPipelineId && stages.length > 0 ? (
        <CreateOpportunityDialog
          open={showCreateOpp}
          onOpenChange={setShowCreateOpp}
          pipelineId={selectedPipelineId}
          stages={stages}
          onCreated={(id) => {
            setShowCreateOpp(false)
            void navigate({ to: "/opportunities/$id", params: { id } })
          }}
        />
      ) : null}
    </div>
  )
}

interface KanbanColumnProps {
  stage: StageRecord
  opportunities: OpportunityRecord[]
  activeId: string | null
}

function KanbanColumn({ stage, opportunities, activeId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const total = opportunities.reduce((sum, o) => sum + (o.valueAmountCents ?? 0), 0)
  const primaryCurrency = opportunities[0]?.valueCurrency ?? null

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] min-w-[280px] flex-col gap-2 rounded-md border bg-muted/30 p-2 transition-colors",
        isOver && "border-primary bg-muted/60",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{stage.name}</p>
          <p className="text-xs text-muted-foreground">
            {opportunities.length} · {formatMoney(total, primaryCurrency)}
          </p>
        </div>
        {stage.probability != null ? (
          <Badge variant="outline" className="text-[10px]">
            {stage.probability}%
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {opportunities.map((opp) => (
          <DraggableOpportunity key={opp.id} opp={opp} isActive={activeId === opp.id} />
        ))}
      </div>
    </div>
  )
}

interface DraggableOpportunityProps {
  opp: OpportunityRecord
  isActive: boolean
}

function DraggableOpportunity({ opp, isActive }: DraggableOpportunityProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: opp.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn("cursor-grab active:cursor-grabbing", isActive && "opacity-40")}
    >
      <OpportunityCard opp={opp} />
    </div>
  )
}

function OpportunityCard({ opp, isDragging }: { opp: OpportunityRecord; isDragging?: boolean }) {
  return (
    <Card className={cn("p-3 text-sm", isDragging && "shadow-lg rotate-2")}>
      <p className="line-clamp-2 font-medium">{opp.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {formatMoney(opp.valueAmountCents, opp.valueCurrency)}
        </span>
        {opp.expectedCloseDate ? (
          <span className="text-xs text-muted-foreground">{formatDate(opp.expectedCloseDate)}</span>
        ) : null}
      </div>
    </Card>
  )
}

interface CreatePipelineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCount: number
  onCreated: (pipelineId: string) => void
}

function CreatePipelineDialog({
  open,
  onOpenChange,
  existingCount,
  onCreated,
}: CreatePipelineDialogProps) {
  const { createPipeline } = usePipelineMutation()
  const [name, setName] = useState("")
  const [isDefault, setIsDefault] = useState(existingCount === 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName("")
      setIsDefault(existingCount === 0)
      setError(null)
    }
  }, [open, existingCount])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Pipeline name is required")
      return
    }
    setError(null)
    try {
      const created = await createPipeline.mutateAsync({
        name: trimmed,
        entityType: "opportunity",
        isDefault,
      })
      onCreated(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create pipeline</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pipeline-name">Name</Label>
            <Input
              id="pipeline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales pipeline"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pipeline-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="pipeline-default" className="text-sm font-normal">
              Set as default pipeline
            </Label>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={createPipeline.isPending}>
            {createPipeline.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ManageStagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelineId: string
  stages: StageRecord[]
}

function ManageStagesDialog({ open, onOpenChange, pipelineId, stages }: ManageStagesDialogProps) {
  const { createStage, updateStage, removeStage } = usePipelineMutation()
  const [newName, setNewName] = useState("")
  const [newProbability, setNewProbability] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNewName("")
      setNewProbability("")
      setError(null)
    }
  }, [open])

  async function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError("Stage name is required")
      return
    }
    const prob = newProbability.trim()
      ? Math.max(0, Math.min(100, Number.parseInt(newProbability, 10) || 0))
      : null
    setError(null)
    try {
      await createStage.mutateAsync({
        pipelineId,
        name: trimmed,
        sortOrder: stages.length,
        probability: prob,
      })
      setNewName("")
      setNewProbability("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stage")
    }
  }

  async function handleRename(stageId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await updateStage.mutateAsync({ id: stageId, input: { name: trimmed } })
    } catch {
      // noop, invalidation restores state
    }
  }

  async function handleRemove(stageId: string) {
    try {
      await removeStage.mutateAsync(stageId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove stage")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage stages</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stages yet. Add one below.</p>
          ) : (
            <ul className="divide-y rounded border">
              {stages.map((stage) => (
                <li key={stage.id} className="flex items-center gap-2 px-2 py-1.5">
                  <Input
                    defaultValue={stage.name}
                    className="h-8 flex-1 text-sm"
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== stage.name) void handleRename(stage.id, v)
                    }}
                  />
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {stage.probability != null ? `${stage.probability}%` : "—"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => void handleRemove(stage.id)}
                    disabled={removeStage.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 rounded border p-2">
            <p className="text-xs font-medium text-muted-foreground">Add stage</p>
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Stage name"
                className="h-8 flex-1 text-sm"
              />
              <Input
                value={newProbability}
                onChange={(e) => setNewProbability(e.target.value)}
                placeholder="%"
                type="number"
                min={0}
                max={100}
                className="h-8 w-16 text-sm"
              />
              <Button size="sm" onClick={() => void handleAdd()} disabled={createStage.isPending}>
                {createStage.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CreateOpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelineId: string
  stages: StageRecord[]
  onCreated: (id: string) => void
}

function CreateOpportunityDialog({
  open,
  onOpenChange,
  pipelineId,
  stages,
  onCreated,
}: CreateOpportunityDialogProps) {
  const { create } = useOpportunityMutation()
  const [title, setTitle] = useState("")
  const [stageId, setStageId] = useState<string>("")
  const [valueAmount, setValueAmount] = useState("")
  const [valueCurrency, setValueCurrency] = useState("USD")
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [personId, setPersonId] = useState<string | null>(null)
  const [personLabel, setPersonLabel] = useState("")
  const [personSearch, setPersonSearch] = useState("")
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationLabel, setOrganizationLabel] = useState("")
  const [organizationSearch, setOrganizationSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const peopleQuery = usePeople({
    search: personSearch || undefined,
    limit: 20,
    enabled: open,
  })
  const organizationsQuery = useOrganizations({
    search: organizationSearch || undefined,
    limit: 20,
    enabled: open,
  })

  const peopleResults = peopleQuery.data?.data ?? []
  const organizationsResults = organizationsQuery.data?.data ?? []
  const peopleIds = useMemo(() => peopleResults.map((p) => p.id), [peopleResults])
  const organizationsIds = useMemo(
    () => organizationsResults.map((o) => o.id),
    [organizationsResults],
  )

  useEffect(() => {
    if (open) {
      setTitle("")
      setStageId(stages[0]?.id ?? "")
      setValueAmount("")
      setValueCurrency("USD")
      setExpectedCloseDate("")
      setPersonId(null)
      setPersonLabel("")
      setPersonSearch("")
      setOrganizationId(null)
      setOrganizationLabel("")
      setOrganizationSearch("")
      setError(null)
    }
  }, [open, stages])

  async function handleSubmit() {
    const trimmed = title.trim()
    if (!trimmed) {
      setError("Title is required")
      return
    }
    if (!stageId) {
      setError("Stage is required")
      return
    }
    const amountCents = valueAmount.trim() ? Math.round(Number.parseFloat(valueAmount) * 100) : null
    if (amountCents != null && !Number.isFinite(amountCents)) {
      setError("Value must be a number")
      return
    }
    setError(null)
    try {
      const created = await create.mutateAsync({
        title: trimmed,
        pipelineId,
        stageId,
        personId,
        organizationId,
        valueAmountCents: amountCents,
        valueCurrency: valueCurrency.trim() || null,
        expectedCloseDate: expectedCloseDate.trim() || null,
      })
      onCreated(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create opportunity")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New opportunity</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opp-title">Title</Label>
            <Input
              id="opp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Honeymoon package for the Smiths"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opp-stage">Stage</Label>
            <Select value={stageId} onValueChange={(v) => setStageId(v ?? "")}>
              <SelectTrigger id="opp-stage" className="w-full">
                <SelectValue>
                  {(value) => stages.find((s) => s.id === value)?.name ?? "Select stage…"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-person">Contact</Label>
              <Combobox
                items={peopleIds}
                value={personId}
                inputValue={personLabel}
                autoHighlight
                filter={() => true}
                itemToStringValue={(id) => {
                  const p = peopleResults.find((x) => x.id === (id as string))
                  return p ? `${p.firstName} ${p.lastName}`.trim() : ""
                }}
                onInputValueChange={(next) => {
                  // Base UI reports inputValue as the raw selected value after selection;
                  // substitute the display name when it matches a known id.
                  const match = peopleResults.find((p) => p.id === next)
                  if (match) {
                    setPersonLabel(`${match.firstName} ${match.lastName}`.trim())
                    return
                  }
                  setPersonLabel(next)
                  setPersonSearch(next)
                  if (!next) setPersonId(null)
                }}
                onValueChange={(next) => {
                  const id = (next as string | null) ?? null
                  setPersonId(id)
                  const p = id ? peopleResults.find((x) => x.id === id) : null
                  const label = p ? `${p.firstName} ${p.lastName}`.trim() : ""
                  setPersonLabel(label)
                  setPersonSearch("")
                }}
              >
                <ComboboxInput
                  id="opp-person"
                  placeholder="Search people…"
                  className="h-9 text-sm"
                  showClear={Boolean(personId)}
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    {peopleQuery.isPending ? "Searching…" : "No people found"}
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(id: string) => {
                        const p = peopleResults.find((x) => x.id === id)
                        if (!p) return null
                        return (
                          <ComboboxItem key={id} value={id}>
                            <span className="truncate">
                              {`${p.firstName} ${p.lastName}`.trim() || "Unnamed"}
                            </span>
                            {p.email ? (
                              <span className="ml-2 truncate text-xs text-muted-foreground">
                                {p.email}
                              </span>
                            ) : null}
                          </ComboboxItem>
                        )
                      }}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-org">Organization</Label>
              <Combobox
                items={organizationsIds}
                value={organizationId}
                inputValue={organizationLabel}
                autoHighlight
                filter={() => true}
                itemToStringValue={(id) => {
                  const o = organizationsResults.find((x) => x.id === (id as string))
                  return o?.name ?? ""
                }}
                onInputValueChange={(next) => {
                  // Base UI reports inputValue as the raw selected value after selection;
                  // substitute the display name when it matches a known id.
                  const match = organizationsResults.find((o) => o.id === next)
                  if (match) {
                    setOrganizationLabel(match.name)
                    return
                  }
                  setOrganizationLabel(next)
                  setOrganizationSearch(next)
                  if (!next) setOrganizationId(null)
                }}
                onValueChange={(next) => {
                  const id = (next as string | null) ?? null
                  setOrganizationId(id)
                  const o = id ? organizationsResults.find((x) => x.id === id) : null
                  setOrganizationLabel(o?.name ?? "")
                  setOrganizationSearch("")
                }}
              >
                <ComboboxInput
                  id="opp-org"
                  placeholder="Search organizations…"
                  className="h-9 text-sm"
                  showClear={Boolean(organizationId)}
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    {organizationsQuery.isPending ? "Searching…" : "No organizations found"}
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(id: string) => {
                        const o = organizationsResults.find((x) => x.id === id)
                        if (!o) return null
                        return (
                          <ComboboxItem key={id} value={id}>
                            <span className="truncate">{o.name}</span>
                            {o.industry ? (
                              <span className="ml-2 truncate text-xs text-muted-foreground">
                                {o.industry}
                              </span>
                            ) : null}
                          </ComboboxItem>
                        )
                      }}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="opp-value">Value</Label>
              <Input
                id="opp-value"
                type="number"
                min={0}
                step="0.01"
                value={valueAmount}
                onChange={(e) => setValueAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-currency">Currency</Label>
              <Combobox
                items={CURRENCY_CODES}
                value={valueCurrency}
                autoHighlight
                filter={(code, query) => {
                  const c = currencies[code as keyof typeof currencies]
                  if (!c) return false
                  const q = query.toLowerCase()
                  return (
                    c.code.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q) ||
                    c.symbol.toLowerCase().includes(q)
                  )
                }}
                onValueChange={(v) => setValueCurrency((v as string | null) ?? "")}
              >
                <ComboboxInput id="opp-currency" placeholder="Search…" className="h-9 text-sm" />
                <ComboboxContent>
                  <ComboboxEmpty>No currencies found</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(code: string) => {
                        const c = currencies[code as keyof typeof currencies]
                        return (
                          <ComboboxItem key={code} value={code}>
                            <span className="min-w-10 font-mono text-xs text-muted-foreground">
                              {code}
                            </span>
                            <span className="truncate">{c?.name ?? code}</span>
                          </ComboboxItem>
                        )
                      }}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opp-close">Expected close date</Label>
            <DatePicker
              value={expectedCloseDate || null}
              onChange={(next) => setExpectedCloseDate(next ?? "")}
              placeholder="Pick a date"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
