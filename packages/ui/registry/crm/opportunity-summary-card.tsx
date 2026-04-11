import { TrendingUp } from "lucide-react"
import { Badge, Card, CardContent } from "@/components/ui"
import { formatDate, formatMoney } from "@/components/voyant/crm/crm-constants"

export function OpportunitySummaryCard({
  title,
  pipelineName,
  stageName,
  status,
  valueAmountCents,
  valueCurrency,
  expectedCloseDate,
}: {
  title: string
  pipelineName: string | null | undefined
  stageName: string | null | undefined
  status: string
  valueAmountCents: number | null | undefined
  valueCurrency: string | null
  expectedCloseDate: string | null | undefined
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pipelineName ?? "…"} · {stageName ?? "…"}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">
            {formatMoney(valueAmountCents, valueCurrency)}
          </span>
        </div>
        {expectedCloseDate ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Expected close: {formatDate(expectedCloseDate)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
