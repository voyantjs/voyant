import { queryOptions } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { IdCard } from "lucide-react"
import { z } from "zod"
import { Input, Label } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import { AddressesTab } from "./_components/addresses-tab"
import { ContactPointsTab } from "./_components/contact-points-tab"
import { NamedContactsTab } from "./_components/named-contacts-tab"

type IdentityTab = "contact-points" | "addresses" | "named-contacts"

type IdentityListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

function getContactPointsQueryOptions(entityType: string, entityId: string) {
  return queryOptions({
    queryKey: ["identity", "contact-points", entityType, entityId],
    queryFn: () =>
      api.get<IdentityListResponse<{ id: string }>>(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/contact-points?limit=200`,
      ),
  })
}

function getAddressesQueryOptions(entityType: string, entityId: string) {
  return queryOptions({
    queryKey: ["identity", "addresses", entityType, entityId],
    queryFn: () =>
      api.get<IdentityListResponse<{ id: string }>>(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/addresses?limit=200`,
      ),
  })
}

function getNamedContactsQueryOptions(entityType: string, entityId: string) {
  return queryOptions({
    queryKey: ["identity", "named-contacts", entityType, entityId],
    queryFn: () =>
      api.get<IdentityListResponse<{ id: string }>>(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/named-contacts?limit=200`,
      ),
  })
}

export const Route = createFileRoute("/_workspace/identity/")({
  validateSearch: z.object({
    entityType: z.string().optional().catch(undefined),
    entityId: z.string().optional().catch(undefined),
    tab: z.enum(["contact-points", "addresses", "named-contacts"]).optional().catch(undefined),
  }),
  loader: ({ context, location }) => {
    const url = new URL(location.href)
    const entityType = url.searchParams.get("entityType")
    const entityId = url.searchParams.get("entityId")

    if (!entityType || !entityId) return

    return Promise.all([
      context.queryClient.ensureQueryData(getContactPointsQueryOptions(entityType, entityId)),
      context.queryClient.ensureQueryData(getAddressesQueryOptions(entityType, entityId)),
      context.queryClient.ensureQueryData(getNamedContactsQueryOptions(entityType, entityId)),
    ])
  },
  component: IdentityPage,
})

function IdentityPage() {
  const navigate = useNavigate()
  const { entityId = "", entityType = "", tab = "contact-points" } = Route.useSearch()
  const activeTab: IdentityTab = tab

  const scopeReady = entityType.trim().length > 0 && entityId.trim().length > 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <IdCard className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Identity</h1>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">
        Manage contact points, addresses and named contacts attached to any entity (person,
        organization, supplier, property, etc.). Enter the entity type and ID below to load its
        identity records.
      </p>

      <div className="grid max-w-2xl grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Entity type</Label>
          <Input
            value={entityType}
            onChange={(e) => {
              const value = e.target.value
              void navigate({
                to: ".",
                replace: true,
                search: (prev) => ({
                  ...prev,
                  entityType: value || undefined,
                }),
              })
            }}
            placeholder="person, organization, supplier…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Entity ID</Label>
          <Input
            value={entityId}
            onChange={(e) => {
              const value = e.target.value
              void navigate({
                to: ".",
                replace: true,
                search: (prev) => ({
                  ...prev,
                  entityId: value || undefined,
                }),
              })
            }}
            placeholder="prsn_… / orgn_… / supp_…"
            className="font-mono text-xs"
          />
        </div>
      </div>

      {!scopeReady && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Enter an entity type and ID above to browse its identity records.
          </p>
        </div>
      )}

      {scopeReady && (
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            void navigate({
              to: ".",
              replace: true,
              search: (prev) => ({
                ...prev,
                tab: value as IdentityTab,
              }),
            })
          }}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="contact-points">Contact Points</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="named-contacts">Named Contacts</TabsTrigger>
          </TabsList>
          <TabsContent value="contact-points" className="mt-4">
            <ContactPointsTab entityType={entityType} entityId={entityId} />
          </TabsContent>
          <TabsContent value="addresses" className="mt-4">
            <AddressesTab entityType={entityType} entityId={entityId} />
          </TabsContent>
          <TabsContent value="named-contacts" className="mt-4">
            <NamedContactsTab entityType={entityType} entityId={entityId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
