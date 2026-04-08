import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  type UpdateOrganizationInput,
  useActivities,
  useOpportunities,
  useOrganization,
  useOrganizationMutation,
  usePeople,
} from "@voyantjs/voyant-crm-ui"
import {
  ArrowLeft,
  Building,
  Calendar,
  CircleDot,
  Globe,
  Hash,
  Languages,
  Loader2,
  Pencil,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react"
import { useState } from "react"
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmActionButton,
} from "@/components/ui"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  formatDate,
  formatMoney,
  formatRelative,
  initialsFrom,
  OPPORTUNITY_STATUS_OPTIONS,
  RELATION_OPTIONS,
  STATUS_OPTIONS,
} from "../_crm/_components/crm-constants"
import { InlineCurrencyField } from "../_crm/_components/inline-currency-field"
import { InlineField } from "../_crm/_components/inline-field"
import { InlineLanguageField } from "../_crm/_components/inline-language-field"
import { InlineNumberField } from "../_crm/_components/inline-number-field"
import { InlineSelectField } from "../_crm/_components/inline-select-field"
import { TagsEditor } from "../_crm/_components/tags-editor"

export const Route = createFileRoute("/_workspace/organizations/$id")({
  component: OrganizationDetailPage,
})

function OrganizationDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    "overview" | "people" | "opportunities" | "activities"
  >("overview")

  const orgQuery = useOrganization(id)
  const { remove, update } = useOrganizationMutation()

  const updateField = async (patch: UpdateOrganizationInput) => {
    await update.mutateAsync({ id, input: patch })
  }

  const org = orgQuery.data

  const peopleQuery = usePeople({ organizationId: id, limit: 50, enabled: Boolean(org) })
  const opportunitiesQuery = useOpportunities({
    organizationId: id,
    limit: 50,
    enabled: Boolean(org),
  })
  const activitiesQuery = useActivities({
    entityType: "organization",
    entityId: id,
    limit: 50,
    enabled: Boolean(org),
  })

  if (orgQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Organization not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/organizations" })}>
          Back to Organizations
        </Button>
      </div>
    )
  }

  const people = peopleQuery.data?.data ?? []
  const opportunities = opportunitiesQuery.data?.data ?? []
  const activities = activitiesQuery.data?.data ?? []

  const openOpportunities = opportunities.filter((o) => o.status === "open")
  const wonOpportunities = opportunities.filter((o) => o.status === "won")
  const totalOpenValue = openOpportunities.reduce((sum, o) => sum + (o.valueAmountCents ?? 0), 0)
  const primaryCurrency = opportunities[0]?.valueCurrency ?? org.defaultCurrency ?? null

  const websiteHref = org.website
    ? org.website.startsWith("http")
      ? org.website
      : `https://${org.website}`
    : undefined

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate({ to: "/organizations" })}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => void navigate({ to: "/organizations" })}
            className="hover:text-foreground"
          >
            Organizations
          </button>
          <span>/</span>
          <span className="text-foreground">{org.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ConfirmActionButton
            buttonLabel="Delete"
            confirmLabel="Delete"
            title="Delete this organization?"
            description="This will permanently remove the organization. People linked to it will remain."
            variant="destructive"
            confirmVariant="destructive"
            disabled={remove.isPending}
            onConfirm={async () => {
              await remove.mutateAsync(id)
              void navigate({ to: "/organizations" })
            }}
          />
        </div>
      </div>

      <div className="grid flex-1 grid-cols-12 gap-4 p-4 lg:p-6">
        {/* Left sidebar */}
        <aside className="col-span-12 flex flex-col gap-4 lg:col-span-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-xl">{initialsFrom(org.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold leading-tight">{org.name}</h2>
                {org.legalName && <p className="text-sm text-muted-foreground">{org.legalName}</p>}
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {org.website}
                  </a>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {org.relation && (
                  <Badge variant="secondary" className="capitalize">
                    {org.relation}
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {org.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">About</CardTitle>
            </CardHeader>
            <CardContent className="divide-y text-sm">
              <InlineField
                icon={Building}
                label="Name"
                value={org.name}
                onSave={(next) => updateField({ name: next ?? org.name })}
              />
              <InlineField
                icon={Building}
                label="Legal name"
                value={org.legalName}
                onSave={(next) => updateField({ legalName: next })}
              />
              <InlineField
                icon={Globe}
                label="Website"
                kind="url"
                value={org.website}
                onSave={(next) => updateField({ website: next })}
              />
              <InlineField
                icon={Hash}
                label="Industry"
                value={org.industry}
                onSave={(next) => updateField({ industry: next })}
              />
              <InlineSelectField
                icon={Users}
                label="Relation"
                value={org.relation}
                options={RELATION_OPTIONS}
                onSave={(next) => updateField({ relation: next })}
              />
              <InlineSelectField
                icon={CircleDot}
                label="Status"
                value={org.status}
                options={STATUS_OPTIONS}
                allowClear={false}
                onSave={(next) => updateField({ status: next ?? "active" })}
              />
              <InlineCurrencyField
                label="Default currency"
                value={org.defaultCurrency}
                onSave={(next) => updateField({ defaultCurrency: next })}
              />
              <InlineLanguageField
                icon={Languages}
                label="Preferred language"
                value={org.preferredLanguage}
                onSave={(next) => updateField({ preferredLanguage: next })}
              />
              <InlineNumberField
                icon={Calendar}
                label="Payment terms (days)"
                value={org.paymentTerms}
                min={0}
                max={365}
                onSave={(next) => updateField({ paymentTerms: next })}
              />
              <InlineField
                icon={Tag}
                label="Source"
                value={org.source}
                onSave={(next) => updateField({ source: next })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsEditor tags={org.tags} onChange={(tags) => updateField({ tags })} />
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <main className="col-span-12 flex flex-col gap-4 lg:col-span-9">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  People
                </p>
                <p className="mt-1 text-2xl font-semibold">{peopleQuery.data?.total ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Open opportunities
                </p>
                <p className="mt-1 text-2xl font-semibold">{openOpportunities.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pipeline value
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatMoney(totalOpenValue, primaryCurrency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Won
                </p>
                <p className="mt-1 text-2xl font-semibold">{wonOpportunities.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "overview" | "people" | "opportunities" | "activities")
              }
            >
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="people">People ({peopleQuery.data?.total ?? 0})</TabsTrigger>
                  <TabsTrigger value="opportunities">
                    Opportunities ({opportunities.length})
                  </TabsTrigger>
                  <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="overview" className="m-0">
                  <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Created
                      </dt>
                      <dd className="mt-0.5">{formatDate(org.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Updated
                      </dt>
                      <dd className="mt-0.5">{formatRelative(org.updatedAt)}</dd>
                    </div>
                    {org.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase text-muted-foreground">
                          Notes
                        </dt>
                        <dd className="mt-0.5 whitespace-pre-wrap">{org.notes}</dd>
                      </div>
                    )}
                  </dl>
                  <Separator className="my-4" />
                  <InlineField
                    label="Notes"
                    kind="textarea"
                    value={org.notes}
                    onSave={(next) => updateField({ notes: next })}
                  />
                </TabsContent>

                <TabsContent value="people" className="m-0">
                  {peopleQuery.isPending ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : people.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No people linked to this organization.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {people.map((p) => {
                        const name =
                          [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed"
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() =>
                                void navigate({ to: "/people/$id", params: { id: p.id } })
                              }
                              className="flex w-full items-center gap-3 py-2 text-left hover:bg-muted/40"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {initialsFrom(name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{name}</p>
                                {p.jobTitle && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {p.jobTitle}
                                  </p>
                                )}
                              </div>
                              {p.email && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {p.email}
                                </span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="opportunities" className="m-0">
                  {opportunitiesQuery.isPending ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : opportunities.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No opportunities.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {opportunities.map((o) => {
                        const statusLabel = OPPORTUNITY_STATUS_OPTIONS.find(
                          (s) => s.value === o.status,
                        )?.label
                        return (
                          <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{o.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {statusLabel ?? o.status} · {formatDate(o.expectedCloseDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-sm font-medium">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatMoney(o.valueAmountCents, o.valueCurrency)}
                              </span>
                              <Badge variant="outline" className="capitalize">
                                {o.status}
                              </Badge>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="m-0">
                  {activitiesQuery.isPending ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : activities.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No activities yet.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {activities.map((a) => (
                        <li key={a.id} className="py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{a.subject}</p>
                              {a.description && (
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                  {a.description}
                                </p>
                              )}
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
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              Fields update on the left panel. Hover to reveal the edit icon.
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
