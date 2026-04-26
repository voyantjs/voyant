"use client"

import type { SearchIndexEntry } from "@voyantjs/cruises-react"
import { Anchor, Calendar, Ship } from "lucide-react"
import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { ExternalCruiseBadge } from "./external-badge"

export interface CruiseCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  cruise: SearchIndexEntry
  onSelect?: (cruise: SearchIndexEntry) => void
}

const CRUISE_TYPE_LABEL: Record<SearchIndexEntry["cruiseType"], string> = {
  ocean: "Ocean",
  river: "River",
  expedition: "Expedition",
  coastal: "Coastal",
}

function formatPrice(amount: string | null, currency: string | null): string {
  if (!amount || !currency) return "Pricing on request"
  const n = Number(amount)
  if (!Number.isFinite(n)) return `${currency} ${amount}`
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/**
 * Display card for a cruise summary — works for both self-managed and
 * external (adapter-sourced) entries. The provenance badge appears for
 * `source: "external"` so operators (and storefront shoppers, if surfaced)
 * can tell at a glance.
 */
export function CruiseCard({ cruise, onSelect, className, ...props }: CruiseCardProps) {
  const isExternal = cruise.source === "external"
  return (
    <Card
      data-slot="cruise-card"
      className={cn("overflow-hidden transition-shadow hover:shadow-md", className)}
      onClick={onSelect ? () => onSelect(cruise) : undefined}
      {...props}
    >
      {cruise.heroImageUrl ? (
        <div
          data-slot="cruise-card-hero"
          className="aspect-[16/9] w-full bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${cruise.heroImageUrl})` }}
          role="img"
          aria-label={cruise.name}
        />
      ) : null}
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge data-slot="cruise-card-type" variant="secondary">
            {CRUISE_TYPE_LABEL[cruise.cruiseType]}
          </Badge>
          {isExternal && cruise.sourceProvider ? (
            <ExternalCruiseBadge sourceProvider={cruise.sourceProvider} />
          ) : null}
        </div>
        <h3 className="text-lg font-semibold leading-tight">{cruise.name}</h3>
        <p className="text-sm text-muted-foreground">
          {cruise.lineName} · {cruise.shipName}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Ship aria-hidden="true" className="size-4 shrink-0" />
          <span>{cruise.nights} nights</span>
        </div>
        {cruise.embarkPortName ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Anchor aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">
              {cruise.embarkPortName}
              {cruise.disembarkPortName && cruise.disembarkPortName !== cruise.embarkPortName
                ? ` → ${cruise.disembarkPortName}`
                : " (round trip)"}
            </span>
          </div>
        ) : null}
        {cruise.earliestDeparture ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar aria-hidden="true" className="size-4 shrink-0" />
            <span>From {cruise.earliestDeparture}</span>
          </div>
        ) : null}
        <div className="pt-2 text-base font-semibold">
          {formatPrice(cruise.lowestPrice, cruise.lowestPriceCurrency)}
          {cruise.lowestPrice ? (
            <span className="text-xs font-normal text-muted-foreground"> from / pp</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
