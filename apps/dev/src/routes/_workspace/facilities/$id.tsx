import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Hotel, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui"
import { buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import { AddressesTab } from "./_components/addresses-tab"
import { ContactPointsTab } from "./_components/contact-points-tab"
import type { FacilityData } from "./_components/facility-dialog"
import { FacilityFeaturesTab } from "./_components/facility-features-tab"
import { NamedContactsTab } from "./_components/named-contacts-tab"
import { OperationSchedulesTab } from "./_components/operation-schedules-tab"
import { PropertyTab } from "./_components/property-tab"

export const Route = createFileRoute("/_workspace/facilities/$id")({
  component: FacilityDetailPage,
})

function FacilityDetailPage() {
  const { id } = Route.useParams()

  const { data: facility, isPending } = useQuery({
    queryKey: ["facilities", "facility", id],
    queryFn: () => api.get<FacilityData>(`/v1/facilities/facilities/${id}`),
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!facility) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Facility not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/facilities" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <Hotel className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{facility.name}</h1>
        <Badge variant="outline" className="capitalize">
          {facility.kind.replace(/_/g, " ")}
        </Badge>
        <Badge variant={facility.status === "active" ? "default" : "outline"}>
          {facility.status}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="contact-points">Contact Points</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="named-contacts">Named Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid max-w-2xl grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Code</p>
              <p className="font-mono text-sm">{facility.code ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Timezone</p>
              <p className="text-sm">{facility.timezone ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">City</p>
              <p className="text-sm">{facility.city ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="text-sm">{facility.country ?? "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{facility.description ?? "-"}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="property" className="mt-4">
          <PropertyTab facilityId={facility.id} />
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <FacilityFeaturesTab facilityId={facility.id} />
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <OperationSchedulesTab facilityId={facility.id} />
        </TabsContent>

        <TabsContent value="contact-points" className="mt-4">
          <ContactPointsTab facilityId={facility.id} />
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          <AddressesTab facilityId={facility.id} />
        </TabsContent>

        <TabsContent value="named-contacts" className="mt-4">
          <NamedContactsTab facilityId={facility.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
