import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  type QuoteLineRecord,
  type UpdateQuoteInput,
  useOpportunity,
  useQuote,
  useQuoteLines,
  useQuoteMutation,
} from "@voyantjs/voyant-crm-ui"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmActionButton,
  Input,
} from "@/components/ui"
import {
  formatDate,
  formatMoney,
  formatRelative,
  QUOTE_STATUS_OPTIONS,
} from "../_crm/_components/crm-constants"
import { InlineCurrencyField } from "../_crm/_components/inline-currency-field"
import { InlineField } from "../_crm/_components/inline-field"
import { InlineSelectField } from "../_crm/_components/inline-select-field"

export const Route = createFileRoute("/_workspace/quotes/$id")({
  component: QuoteDetailPage,
})

function QuoteDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const quoteQuery = useQuote(id)
  const linesQuery = useQuoteLines(id)
  const { remove, update, createLine, updateLine, removeLine } = useQuoteMutation()

  const updateField = async (patch: UpdateQuoteInput) => {
    await update.mutateAsync({ id, input: patch })
  }

  const quote = quoteQuery.data
  const lines = linesQuery.data ?? []

  const opportunityQuery = useOpportunity(quote?.opportunityId ?? undefined, {
    enabled: Boolean(quote?.opportunityId),
  })
  const opportunity = opportunityQuery.data

  if (quoteQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Quote not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/quotes" })}>
          Back to Quotes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate({ to: "/quotes" })}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => void navigate({ to: "/quotes" })}
            className="hover:text-foreground"
          >
            Quotes
          </button>
          <span>/</span>
          <span className="font-mono text-foreground">{quote.id.slice(-8)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {quote.status === "draft" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void updateField({ status: "sent" })}
              disabled={update.isPending}
            >
              Mark sent
            </Button>
          ) : null}
          {quote.status === "sent" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void updateField({ status: "accepted" })}
                disabled={update.isPending}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void updateField({ status: "rejected" })}
                disabled={update.isPending}
              >
                Reject
              </Button>
            </>
          ) : null}
          <ConfirmActionButton
            buttonLabel="Delete"
            confirmLabel="Delete"
            title="Delete this quote?"
            description="This will permanently remove the quote and all its lines."
            variant="destructive"
            confirmVariant="destructive"
            disabled={remove.isPending}
            onConfirm={async () => {
              await remove.mutateAsync(id)
              void navigate({ to: "/quotes" })
            }}
          />
        </div>
      </div>

      <div className="grid flex-1 grid-cols-12 gap-4 p-4 lg:p-6">
        <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatMoney(quote.totalAmountCents, quote.currency)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {quote.status}
                </Badge>
                {quote.validUntil ? (
                  <span className="text-xs text-muted-foreground">
                    Valid until {formatDate(quote.validUntil)}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quote details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y text-sm">
              <InlineSelectField
                label="Status"
                value={quote.status}
                options={QUOTE_STATUS_OPTIONS}
                allowClear={false}
                onSave={(next) => updateField({ status: next ?? quote.status })}
              />
              <InlineCurrencyField
                label="Currency"
                value={quote.currency}
                onSave={(next) => updateField({ currency: next ?? quote.currency })}
              />
              <InlineField
                label="Valid until"
                placeholder="YYYY-MM-DD"
                value={quote.validUntil}
                onSave={(next) => updateField({ validUntil: next })}
              />
              <InlineField
                label="Notes"
                kind="textarea"
                value={quote.notes}
                onSave={(next) => updateField({ notes: next })}
              />
            </CardContent>
          </Card>

          {opportunity ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Linked opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: "/opportunities/$id",
                      params: { id: opportunity.id },
                    })
                  }
                  className="w-full rounded border p-2 text-left text-sm hover:bg-muted/40"
                >
                  <p className="truncate font-medium">{opportunity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(opportunity.valueAmountCents, opportunity.valueCurrency)}
                    {" · "}
                    {opportunity.status}
                  </p>
                </button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="flex flex-col gap-1 pt-6 text-xs text-muted-foreground">
              <span>Created {formatRelative(quote.createdAt)}</span>
              <span>Updated {formatRelative(quote.updatedAt)}</span>
            </CardContent>
          </Card>
        </aside>

        <main className="col-span-12 flex flex-col gap-4 lg:col-span-8">
          <QuoteLinesCard
            quoteId={id}
            currency={quote.currency}
            lines={lines}
            isLoading={linesQuery.isPending}
            onCreate={async (input) => {
              await createLine.mutateAsync({ quoteId: id, input })
            }}
            onUpdate={async (lineId, input) => {
              await updateLine.mutateAsync({ quoteId: id, lineId, input })
            }}
            onRemove={async (lineId) => {
              await removeLine.mutateAsync({ quoteId: id, lineId })
            }}
          />
        </main>
      </div>
    </div>
  )
}

interface QuoteLinesCardProps {
  quoteId: string
  currency: string
  lines: QuoteLineRecord[]
  isLoading: boolean
  onCreate: (input: {
    description: string
    currency: string
    quantity: number
    unitPriceAmountCents: number
    totalAmountCents: number
  }) => Promise<void>
  onUpdate: (
    lineId: string,
    input: Partial<{
      description: string
      quantity: number
      unitPriceAmountCents: number
      totalAmountCents: number
    }>,
  ) => Promise<void>
  onRemove: (lineId: string) => Promise<void>
}

function QuoteLinesCard({
  quoteId: _quoteId,
  currency,
  lines,
  isLoading,
  onCreate,
  onUpdate,
  onRemove,
}: QuoteLinesCardProps) {
  const [newDescription, setNewDescription] = useState("")
  const [newQuantity, setNewQuantity] = useState("1")
  const [newPrice, setNewPrice] = useState("0")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    const desc = newDescription.trim()
    if (!desc) {
      setError("Description is required")
      return
    }
    const qty = Number.parseInt(newQuantity, 10) || 1
    const price = Number.parseInt(newPrice, 10) || 0
    setAdding(true)
    setError(null)
    try {
      await onCreate({
        description: desc,
        currency,
        quantity: qty,
        unitPriceAmountCents: price,
        totalAmountCents: qty * price,
      })
      setNewDescription("")
      setNewQuantity("1")
      setNewPrice("0")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add line")
    } finally {
      setAdding(false)
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + l.totalAmountCents, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Line items</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : lines.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No line items yet.</p>
        ) : (
          <ul className="divide-y">
            {lines.map((line) => (
              <QuoteLineRow
                key={line.id}
                line={line}
                onUpdate={(input) => onUpdate(line.id, input)}
                onRemove={() => onRemove(line.id)}
              />
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-col gap-2 border-t pt-3">
          <div className="grid grid-cols-12 gap-2">
            <Input
              className="col-span-6 h-8 text-sm"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description"
            />
            <Input
              className="col-span-2 h-8 text-sm"
              type="number"
              min={1}
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="Qty"
            />
            <Input
              className="col-span-3 h-8 text-sm"
              type="number"
              min={0}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price (cents)"
            />
            <Button
              size="sm"
              className="col-span-1 h-8"
              onClick={() => void handleAdd()}
              disabled={adding}
            >
              {adding ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
            </Button>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatMoney(subtotal, currency)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function QuoteLineRow({
  line,
  onUpdate,
  onRemove,
}: {
  line: QuoteLineRecord
  onUpdate: (input: {
    description?: string
    quantity?: number
    unitPriceAmountCents?: number
    totalAmountCents?: number
  }) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    setRemoving(true)
    try {
      await onRemove()
    } finally {
      setRemoving(false)
    }
  }

  async function handleQuantity(value: string) {
    const qty = Number.parseInt(value, 10)
    if (!Number.isFinite(qty) || qty < 1) return
    await onUpdate({
      quantity: qty,
      totalAmountCents: qty * line.unitPriceAmountCents,
    })
  }

  async function handlePrice(value: string) {
    const price = Number.parseInt(value, 10)
    if (!Number.isFinite(price) || price < 0) return
    await onUpdate({
      unitPriceAmountCents: price,
      totalAmountCents: line.quantity * price,
    })
  }

  return (
    <li className="py-2">
      <div className="grid grid-cols-12 items-center gap-2">
        <Input
          className="col-span-6 h-8 text-sm"
          defaultValue={line.description}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v && v !== line.description) void onUpdate({ description: v })
          }}
        />
        <Input
          className="col-span-2 h-8 text-sm"
          type="number"
          min={1}
          defaultValue={line.quantity}
          onBlur={(e) => void handleQuantity(e.target.value)}
        />
        <Input
          className="col-span-2 h-8 text-sm"
          type="number"
          min={0}
          defaultValue={line.unitPriceAmountCents}
          onBlur={(e) => void handlePrice(e.target.value)}
        />
        <span className="col-span-1 text-right text-sm font-medium">
          {formatMoney(line.totalAmountCents, line.currency)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="col-span-1 h-8 w-8 p-0"
          onClick={() => void handleRemove()}
          disabled={removing}
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      </div>
    </li>
  )
}
