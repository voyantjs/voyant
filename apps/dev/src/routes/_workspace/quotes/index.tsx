import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  type OpportunityRecord,
  type QuoteRecord,
  useOpportunities,
  useQuoteMutation,
  useQuotes,
} from "@voyantjs/crm-react"
import { currencies } from "@voyantjs/utils/currencies"
import { Loader2, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatDate,
  formatMoney,
  formatRelative,
  QUOTE_STATUS_OPTIONS,
} from "../_crm/_components/crm-constants"
import { getQuotesQueryOptions } from "../_crm/_lib/crm-query-options"

const CURRENCY_CODES = Object.keys(currencies).sort()

export const Route = createFileRoute("/_workspace/quotes/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getQuotesQueryOptions({ limit: 100 })),
  component: QuotesPage,
})

function QuotesPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isPending, isError } = useQuotes({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  })

  const quotes = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Quotes issued for opportunities in your pipeline.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          New quote
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {QUOTE_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-destructive">
                  Failed to load quotes.
                </TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No quotes found.
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((q: QuoteRecord) => (
                <TableRow
                  key={q.id}
                  onClick={() => void navigate({ to: "/quotes/$id", params: { id: q.id } })}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs">{q.id.slice(-8)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(q.totalAmountCents, q.currency)}
                  </TableCell>
                  <TableCell>{formatDate(q.validUntil)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelative(q.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateQuoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

function CreateQuoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  const navigate = useNavigate()
  const { create } = useQuoteMutation()

  const [opportunityId, setOpportunityId] = useState<string | null>(null)
  const [opportunityLabel, setOpportunityLabel] = useState("")
  const [opportunitySearch, setOpportunitySearch] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [validUntil, setValidUntil] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const opportunitiesQuery = useOpportunities({
    search: opportunitySearch || undefined,
    limit: 20,
    enabled: open,
  })
  const opportunityResults = useMemo(
    () => opportunitiesQuery.data?.data ?? [],
    [opportunitiesQuery.data],
  )
  const opportunityIds = useMemo(() => opportunityResults.map((o) => o.id), [opportunityResults])

  function reset() {
    setOpportunityId(null)
    setOpportunityLabel("")
    setOpportunitySearch("")
    setCurrency("USD")
    setValidUntil(null)
    setError(null)
  }

  async function handleCreate() {
    if (!opportunityId) {
      setError("Please select an opportunity")
      return
    }
    if (!currency) {
      setError("Please select a currency")
      return
    }
    setError(null)
    try {
      const quote = await create.mutateAsync({
        opportunityId,
        currency,
        validUntil: validUntil ?? null,
      })
      reset()
      onOpenChange(false)
      void navigate({ to: "/quotes/$id", params: { id: quote.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote")
    }
  }

  function describeOpportunity(opp: OpportunityRecord): string {
    const money = formatMoney(opp.valueAmountCents, opp.valueCurrency)
    return `${opp.title} · ${money}`
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New quote</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Opportunity</Label>
            <Combobox
              items={opportunityIds}
              value={opportunityId}
              inputValue={opportunityLabel}
              autoHighlight
              filter={() => true}
              itemToStringValue={(id) => {
                const o = opportunityResults.find((x) => x.id === (id as string))
                return o ? describeOpportunity(o) : ""
              }}
              onInputValueChange={(next) => {
                const match = opportunityResults.find((o) => o.id === next)
                if (match) {
                  setOpportunityLabel(describeOpportunity(match))
                  return
                }
                setOpportunityLabel(next)
                setOpportunitySearch(next)
                if (!next) setOpportunityId(null)
              }}
              onValueChange={(next) => {
                const id = (next as string | null) ?? null
                setOpportunityId(id)
                const o = id ? opportunityResults.find((x) => x.id === id) : null
                if (o) {
                  setOpportunityLabel(describeOpportunity(o))
                  if (o.valueCurrency) setCurrency(o.valueCurrency)
                } else {
                  setOpportunityLabel("")
                }
                setOpportunitySearch("")
              }}
            >
              <ComboboxInput placeholder="Search opportunities…" />
              <ComboboxContent>
                <ComboboxEmpty>
                  {opportunitiesQuery.isPending ? "Loading…" : "No opportunities found."}
                </ComboboxEmpty>
                <ComboboxList>
                  <ComboboxCollection>
                    {(id) => {
                      const o = opportunityResults.find((x) => x.id === (id as string))
                      if (!o) return null
                      return (
                        <ComboboxItem key={o.id} value={o.id}>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">{o.title}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {formatMoney(o.valueAmountCents, o.valueCurrency)} · {o.status}
                            </span>
                          </div>
                        </ComboboxItem>
                      )
                    }}
                  </ComboboxCollection>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Combobox
                items={CURRENCY_CODES}
                value={currency}
                autoHighlight
                itemToStringValue={(code) => {
                  const info = currencies[code as keyof typeof currencies]
                  return info ? `${code} — ${info.name}` : (code as string)
                }}
                onValueChange={(next) => {
                  if (typeof next === "string") setCurrency(next)
                }}
              >
                <ComboboxInput />
                <ComboboxContent>
                  <ComboboxEmpty>No currency found.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(code) => {
                        const info = currencies[code as keyof typeof currencies]
                        return (
                          <ComboboxItem key={code as string} value={code as string}>
                            <span className="font-mono text-xs">{code as string}</span>
                            {info ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {info.name}
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
              <Label>Valid until</Label>
              <DatePicker
                value={validUntil}
                onChange={setValidUntil}
                placeholder="Pick a date"
                clearable
              />
            </div>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
