import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  type UpdateOpportunityInput,
  useActivities,
  useOpportunity,
  useOpportunityMutation,
  useOrganization,
  usePerson,
  usePipeline,
  useQuoteMutation,
  useQuotes,
  useStages,
} from "@voyantjs/voyant-crm-ui"
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  CircleDot,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Tag,
  Target,
  TrendingUp,
  User,
} from "lucide-react"
import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmActionButton,
} from "@/components/ui"
import {
  formatDate,
  formatMoney,
  formatRelative,
  OPPORTUNITY_STATUS_OPTIONS,
} from "../_crm/_components/crm-constants"
import { InlineCurrencyField } from "../_crm/_components/inline-currency-field"
import { InlineField } from "../_crm/_components/inline-field"
import { InlineNumberField } from "../_crm/_components/inline-number-field"
import { InlineSelectField } from "../_crm/_components/inline-select-field"
import { TagsEditor } from "../_crm/_components/tags-editor"

export const Route = createFileRoute("/_workspace/opportunities/$id")({
  component: OpportunityDetailPage,
})

function OpportunityDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [lostReasonDraft, setLostReasonDraft] = useState("")
  const [showLostDialog, setShowLostDialog] = useState(false)

  const oppQuery = useOpportunity(id)
  const { remove, update } = useOpportunityMutation()
  const { create: createQuote } = useQuoteMutation()

  const updateField = async (patch: UpdateOpportunityInput) => {
    await update.mutateAsync({ id, input: patch })
  }

  const opp = oppQuery.data

  const personQuery = usePerson(opp?.personId ?? undefined, { enabled: Boolean(opp?.personId) })
  const orgQuery = useOrganization(opp?.organizationId ?? undefined, {
    enabled: Boolean(opp?.organizationId),
  })
  const pipelineQuery = usePipeline(opp?.pipelineId, { enabled: Boolean(opp?.pipelineId) })
  const stagesQuery = useStages({
    pipelineId: opp?.pipelineId,
    limit: 100,
    enabled: Boolean(opp?.pipelineId),
  })
  const activitiesQuery = useActivities({
    entityType: "opportunity",
    entityId: id,
    limit: 50,
    enabled: Boolean(opp),
  })
  const quotesQuery = useQuotes({
    opportunityId: id,
    limit: 50,
    enabled: Boolean(opp),
  })

  const stages = useMemo(
    () => [...(stagesQuery.data?.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [stagesQuery.data],
  )
  const activities = activitiesQuery.data?.data ?? []
  const currentStage = stages.find((s) => s.id === opp?.stageId)
  const person = personQuery.data
  const organization = orgQuery.data

  if (oppQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Opportunity not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/opportunities" })}>
          Back to Opportunities
        </Button>
      </div>
    )
  }

  const personName = person
    ? [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unnamed person"
    : null

  async function markWon() {
    const wonStage = stages.find((s) => s.isWon)
    await updateField({
      status: "won",
      ...(wonStage ? { stageId: wonStage.id } : {}),
    })
  }

  async function submitLost() {
    const lostStage = stages.find((s) => s.isLost)
    await updateField({
      status: "lost",
      lostReason: lostReasonDraft.trim() || null,
      ...(lostStage ? { stageId: lostStage.id } : {}),
    })
    setShowLostDialog(false)
    setLostReasonDraft("")
  }

  async function reopen() {
    await updateField({ status: "open", lostReason: null })
  }

  async function createQuoteForOpp() {
    const quote = await createQuote.mutateAsync({
      opportunityId: id,
      currency: opp?.valueCurrency ?? "USD",
    })
    void navigate({ to: "/quotes/$id", params: { id: quote.id } })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate({ to: "/opportunities" })}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => void navigate({ to: "/opportunities" })}
            className="hover:text-foreground"
          >
            Opportunities
          </button>
          <span>/</span>
          <span className="truncate text-foreground">{opp.title}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void createQuoteForOpp()}
            disabled={createQuote.isPending}
          >
            {createQuote.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-4 w-4" />
            )}
            New quote
          </Button>
          {opp.status === "open" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void markWon()}
                disabled={update.isPending}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Mark won
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLostDialog(true)}
                disabled={update.isPending}
              >
                <Ban className="mr-1.5 h-4 w-4" />
                Mark lost
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void reopen()}
              disabled={update.isPending}
            >
              Reopen
            </Button>
          )}
          <ConfirmActionButton
            buttonLabel="Delete"
            confirmLabel="Delete"
            title="Delete this opportunity?"
            description="This will permanently remove the opportunity. This action cannot be undone."
            variant="destructive"
            confirmVariant="destructive"
            disabled={remove.isPending}
            onConfirm={async () => {
              await remove.mutateAsync(id)
              void navigate({ to: "/opportunities" })
            }}
          />
        </div>
      </div>

      {showLostDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-4">
            <CardTitle className="mb-2">Mark opportunity as lost</CardTitle>
            <p className="mb-3 text-sm text-muted-foreground">Optionally add a lost reason.</p>
            <textarea
              value={lostReasonDraft}
              onChange={(e) => setLostReasonDraft(e.target.value)}
              placeholder="Reason (optional)…"
              className="w-full rounded border px-2 py-1.5 text-sm"
              rows={3}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLostDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void submitLost()} disabled={update.isPending}>
                Mark lost
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid flex-1 grid-cols-12 gap-4 p-4 lg:p-6">
        {/* Left sidebar */}
        <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-tight">{opp.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pipelineQuery.data?.name ?? "…"} · {currentStage?.name ?? "…"}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {opp.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {formatMoney(opp.valueAmountCents, opp.valueCurrency)}
                </span>
              </div>
              {opp.expectedCloseDate ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Expected close: {formatDate(opp.expectedCloseDate)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Deal details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y text-sm">
              <InlineField
                icon={Target}
                label="Title"
                value={opp.title}
                onSave={(next) => updateField({ title: next ?? "" })}
              />
              <InlineSelectField
                icon={CircleDot}
                label="Stage"
                value={opp.stageId}
                options={stages.map((s) => ({ value: s.id, label: s.name }))}
                allowClear={false}
                onSave={(next) => updateField({ stageId: next ?? opp.stageId })}
              />
              <InlineSelectField
                icon={CircleDot}
                label="Status"
                value={opp.status}
                options={OPPORTUNITY_STATUS_OPTIONS}
                allowClear={false}
                onSave={(next) => updateField({ status: next ?? opp.status })}
              />
              <InlineNumberField
                icon={DollarSign}
                label="Value (cents)"
                value={opp.valueAmountCents}
                min={0}
                onSave={(next) => updateField({ valueAmountCents: next })}
              />
              <InlineCurrencyField
                label="Currency"
                value={opp.valueCurrency}
                onSave={(next) => updateField({ valueCurrency: next })}
              />
              <InlineField
                icon={Calendar}
                label="Expected close date"
                placeholder="YYYY-MM-DD"
                value={opp.expectedCloseDate}
                onSave={(next) => updateField({ expectedCloseDate: next })}
              />
              <InlineField
                icon={Tag}
                label="Source"
                value={opp.source}
                onSave={(next) => updateField({ source: next })}
              />
              <InlineField
                label="Source ref"
                value={opp.sourceRef}
                onSave={(next) => updateField({ sourceRef: next })}
              />
              {opp.status === "lost" ? (
                <InlineField
                  label="Lost reason"
                  kind="textarea"
                  value={opp.lostReason}
                  onSave={(next) => updateField({ lostReason: next })}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsEditor tags={opp.tags} onChange={(tags) => updateField({ tags })} />
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <main className="col-span-12 flex flex-col gap-4 lg:col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {personName ? (
                <button
                  type="button"
                  onClick={() =>
                    person && void navigate({ to: "/people/$id", params: { id: person.id } })
                  }
                  className="flex w-full items-center gap-2 rounded border p-2 text-left hover:bg-muted/40"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{personName}</p>
                    {person?.jobTitle ? (
                      <p className="truncate text-xs text-muted-foreground">{person.jobTitle}</p>
                    ) : null}
                  </div>
                </button>
              ) : (
                <p className="text-muted-foreground italic">No person linked.</p>
              )}
              {organization ? (
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: "/organizations/$id",
                      params: { id: organization.id },
                    })
                  }
                  className="flex w-full items-center gap-2 rounded border p-2 text-left hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{organization.name}</p>
                    {organization.industry ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {organization.industry}
                      </p>
                    ) : null}
                  </div>
                </button>
              ) : (
                <p className="text-muted-foreground italic">No organization linked.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Quotes</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void createQuoteForOpp()}
                disabled={createQuote.isPending}
              >
                {createQuote.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                )}
                New quote
              </Button>
            </CardHeader>
            <CardContent>
              {quotesQuery.isPending ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (quotesQuery.data?.data ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No quotes yet.</p>
              ) : (
                <ul className="divide-y">
                  {quotesQuery.data?.data.map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => void navigate({ to: "/quotes/$id", params: { id: q.id } })}
                        className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs">{q.id.slice(-8)}</p>
                          {q.validUntil ? (
                            <p className="text-xs text-muted-foreground">
                              Valid until {formatDate(q.validUntil)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="capitalize">
                            {q.status}
                          </Badge>
                          <span className="text-xs font-medium">
                            {formatMoney(q.totalAmountCents, q.currency)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesQuery.isPending ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : activities.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No activities yet.</p>
              ) : (
                <ul className="divide-y">
                  {activities.map((a) => (
                    <li key={a.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.subject}</p>
                          {a.description ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {a.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="capitalize">
                            {a.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelative(a.createdAt)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
