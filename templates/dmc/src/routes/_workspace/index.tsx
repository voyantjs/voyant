import { createFileRoute } from "@tanstack/react-router"

import { TypographyH1, TypographyLead } from "@/components/ui/typography"

export const Route = createFileRoute("/_workspace/")({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <TypographyH1 className="text-2xl">Voyant Console</TypographyH1>
        <TypographyLead className="mt-2 text-base">
          Operational framework for travel companies.
        </TypographyLead>
      </div>
    </div>
  )
}
