import { useMutation, useQuery } from "@tanstack/react-query"
import { useOptionUnitMutation, useProductOptionMutation } from "@voyantjs/products-react"
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { OptionDialog, type ProductOptionData } from "./product-option-dialog"
import { PricingPanel } from "./product-options-pricing"
import {
  getOptionUnitsQueryOptions,
  getProductOptionsQueryOptions,
  optionStatusVariant,
} from "./product-options-shared"
import { type OptionUnitData, UnitDialog } from "./product-unit-dialog"

export function OptionsSection({ productId }: { productId: string }) {
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null)
  const [optionDialogOpen, setOptionDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<ProductOptionData | undefined>()

  const { data: optionsData, refetch: refetchOptions } = useQuery(
    getProductOptionsQueryOptions(productId),
  )
  const { remove: removeOption } = useProductOptionMutation()

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: string) => removeOption.mutateAsync(optionId),
    onSuccess: () => {
      void refetchOptions()
    },
  })

  const options = (optionsData?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSortOrder = options.length > 0 ? Math.max(...options.map((o) => o.sortOrder)) + 1 : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Options</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setEditingOption(undefined)
            setOptionDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </CardHeader>
      <CardContent>
        {options.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No options yet.</p>
        )}

        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              productId={productId}
              expanded={expandedOptionId === option.id}
              onToggle={() =>
                setExpandedOptionId(expandedOptionId === option.id ? null : option.id)
              }
              onEdit={() => {
                setEditingOption(option)
                setOptionDialogOpen(true)
              }}
              onDelete={() => {
                if (confirm(`Delete option "${option.name}" and all its units and prices?`)) {
                  deleteOptionMutation.mutate(option.id)
                }
              }}
            />
          ))}
        </div>
      </CardContent>

      <OptionDialog
        open={optionDialogOpen}
        onOpenChange={setOptionDialogOpen}
        productId={productId}
        option={editingOption}
        nextSortOrder={nextSortOrder}
        onSuccess={() => {
          setOptionDialogOpen(false)
          setEditingOption(undefined)
          void refetchOptions()
        }}
      />
    </Card>
  )
}

function OptionRow({
  option,
  productId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  option: ProductOptionData
  productId: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium">{option.name}</span>
          {option.code && (
            <span className="font-mono text-xs text-muted-foreground">{option.code}</span>
          )}
          <Badge variant={optionStatusVariant[option.status] ?? "outline"} className="capitalize">
            {option.status}
          </Badge>
          {option.isDefault && <Badge variant="secondary">Default</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 border-t bg-muted/30 p-3">
          <UnitsPanel optionId={option.id} />
          <PricingPanel productId={productId} optionId={option.id} />
        </div>
      )}
    </div>
  )
}

function UnitsPanel({ optionId }: { optionId: string }) {
  const [unitDialogOpen, setUnitDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OptionUnitData | undefined>()

  const { data, refetch } = useQuery(getOptionUnitsQueryOptions(optionId))
  const { remove } = useOptionUnitMutation()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove.mutateAsync(id),
    onSuccess: () => {
      void refetch()
    },
  })

  const units = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSort = units.length > 0 ? Math.max(...units.map((u) => u.sortOrder)) + 1 : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Units</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingUnit(undefined)
            setUnitDialogOpen(true)
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Unit
        </Button>
      </div>

      {units.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">No units yet.</p>
      )}

      {units.length > 0 && (
        <div className="rounded border bg-background">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-2 text-left font-medium">Type</th>
                <th className="p-2 text-left font-medium">Name</th>
                <th className="p-2 text-left font-medium">Qty</th>
                <th className="p-2 text-left font-medium">Age</th>
                <th className="p-2 text-left font-medium">Occupancy</th>
                <th className="w-16 p-2" />
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b last:border-b-0">
                  <td className="p-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {unit.unitType}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {unit.name}
                    {unit.code && (
                      <span className="ml-2 font-mono text-muted-foreground">{unit.code}</span>
                    )}
                  </td>
                  <td className="p-2 font-mono">
                    {unit.minQuantity ?? 0}–{unit.maxQuantity ?? "∞"}
                  </td>
                  <td className="p-2 font-mono">
                    {unit.minAge != null || unit.maxAge != null
                      ? `${unit.minAge ?? 0}–${unit.maxAge ?? "∞"}`
                      : "-"}
                  </td>
                  <td className="p-2 font-mono">
                    {unit.occupancyMin != null || unit.occupancyMax != null
                      ? `${unit.occupancyMin ?? 0}–${unit.occupancyMax ?? "∞"}`
                      : "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnit(unit)
                          setUnitDialogOpen(true)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete unit "${unit.name}"?`)) {
                            deleteMutation.mutate(unit.id)
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        optionId={optionId}
        unit={editingUnit}
        nextSortOrder={nextSort}
        onSuccess={() => {
          setUnitDialogOpen(false)
          setEditingUnit(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
