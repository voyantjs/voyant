import { createFileRoute } from "@tanstack/react-router"
import { IdCard } from "lucide-react"
import { useState } from "react"
import { Input, Label } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddressesTab } from "./_components/addresses-tab"
import { ContactPointsTab } from "./_components/contact-points-tab"
import { NamedContactsTab } from "./_components/named-contacts-tab"

export const Route = createFileRoute("/_workspace/identity/")({
  component: IdentityPage,
})

function IdentityPage() {
  const [entityType, setEntityType] = useState("")
  const [entityId, setEntityId] = useState("")

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
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="person, organization, supplier…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Entity ID</Label>
          <Input
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
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
        <Tabs defaultValue="contact-points" className="w-full">
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
