import type {
  OpportunityRecord as OpportunityData,
  StageRecord as StageData,
} from "@voyantjs/crm-react"
import { TrendingUp } from "lucide-react"
import { Card } from "@/components/ui"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatDate, formatMoney } from "@/components/voyant/crm/crm-constants"

export function OpportunitiesBoard({
  stages,
  opportunitiesByStage,
}: {
  stages: StageData[]
  opportunitiesByStage: Map<string, OpportunityData[]>
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex gap-3 pb-2">
        {stages.map((stage) => {
          const opportunities = opportunitiesByStage.get(stage.id) ?? []
          const total = opportunities.reduce(
            (sum, opportunity) => sum + (opportunity.valueAmountCents ?? 0),
            0,
          )
          const primaryCurrency = opportunities[0]?.valueCurrency ?? null

          return (
            <div
              key={stage.id}
              className="flex w-[280px] min-w-[280px] flex-col gap-2 rounded-md border bg-muted/30 p-2"
            >
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {opportunities.length} · {formatMoney(total, primaryCurrency)}
                  </p>
                </div>
                {stage.probability != null ? (
                  <span className="rounded border px-1.5 py-0.5 text-[10px]">
                    {stage.probability}%
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="p-3 text-sm">
                    <p className="line-clamp-2 font-medium">{opportunity.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {formatMoney(opportunity.valueAmountCents, opportunity.valueCurrency)}
                      </span>
                      {opportunity.expectedCloseDate ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(opportunity.expectedCloseDate)}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
