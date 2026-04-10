import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api-client"
import { OptionDialog, type ProductOptionData } from "./option-dialog"
import { type OptionPriceRuleData, OptionPriceRuleDialog } from "./option-price-rule-dialog"
import { type OptionUnitData, UnitDialog } from "./unit-dialog"
import { type OptionUnitPriceRuleData, UnitPriceRuleDialog } from "./unit-price-rule-dialog"

type OptionListResponse = { data: ProductOptionData[] }
type UnitListResponse = { data: OptionUnitData[] }
type PriceRuleListResponse = { data: OptionPriceRuleData[] }
type UnitPriceRuleListResponse = { data: OptionUnitPriceRuleData[] }
type CategoryListResponse = {
  data: { id: string; name: string; code: string | null; categoryType: string }[]
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  active: "default",
  archived: "secondary",
}

export function getProductOptionsQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ["product-options", productId],
    queryFn: () =>
      api.get<OptionListResponse>(`/v1/products/options?productId=${productId}&limit=100`),
  })
}

function ActionMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export function OptionsSection({ productId }: { productId: string }) {
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null)
  const [optionDialogOpen, setOptionDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<ProductOptionData | undefined>()

  const { data: optionsData, refetch: refetchOptions } = useQuery(
    getProductOptionsQueryOptions(productId),
  )

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: string) => api.delete(`/v1/products/options/${optionId}`),
    onSuccess: () => void refetchOptions(),
  })

  const options = (optionsData?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSortOrder = options.length > 0 ? Math.max(...options.map((o) => o.sortOrder)) + 1 : 0

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-semibold leading-none tracking-tight">Options</h2>
        <ActionMenu>
          <DropdownMenuItem
            onClick={() => {
              setEditingOption(undefined)
              setOptionDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add Option
          </DropdownMenuItem>
        </ActionMenu>
      </div>
      <Separator />
      <div className="px-6 py-4">
        {options.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No options yet.</p>
        ) : (
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
        )}
      </div>

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
    </div>
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
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium">{option.name}</span>
          {option.code && (
            <span className="font-mono text-xs text-muted-foreground">{option.code}</span>
          )}
          <Badge variant={statusVariant[option.status] ?? "outline"} className="capitalize">
            {option.status}
          </Badge>
          {option.isDefault && <Badge variant="secondary">Default</Badge>}
        </div>
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </ActionMenu>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 border-t p-4">
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

  const { data, refetch } = useQuery({
    queryKey: ["option-units", optionId],
    queryFn: () => api.get<UnitListResponse>(`/v1/products/units?optionId=${optionId}&limit=100`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/products/units/${id}`),
    onSuccess: () => void refetch(),
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

      {units.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">No units yet.</p>
      ) : (
        <div className="rounded border bg-background">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-2 text-left font-medium">Type</th>
                <th className="p-2 text-left font-medium">Name</th>
                <th className="p-2 text-left font-medium">Qty</th>
                <th className="p-2 text-left font-medium">Age</th>
                <th className="p-2 text-left font-medium">Occupancy</th>
                <th className="w-10 p-2" />
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
                    <ActionMenu>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUnit(unit)
                          setUnitDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Delete unit "${unit.name}"?`)) {
                            deleteMutation.mutate(unit.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </ActionMenu>
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

function PricingPanel({ productId, optionId }: { productId: string; optionId: string }) {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<OptionPriceRuleData | undefined>()

  const { data, refetch } = useQuery({
    queryKey: ["option-price-rules", optionId],
    queryFn: () =>
      api.get<PriceRuleListResponse>(
        `/v1/pricing/option-price-rules?optionId=${optionId}&limit=100`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/option-price-rules/${id}`),
    onSuccess: () => void refetch(),
  })

  const rules = data?.data ?? []

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRule(undefined)
            setRuleDialogOpen(true)
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Price Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No price rules yet. Link a catalog to start pricing.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <PriceRuleCard
              key={rule.id}
              rule={rule}
              optionId={optionId}
              onEdit={() => {
                setEditingRule(rule)
                setRuleDialogOpen(true)
              }}
              onDelete={() => {
                if (confirm(`Delete price rule "${rule.name}"?`)) {
                  deleteMutation.mutate(rule.id)
                }
              }}
            />
          ))}
        </div>
      )}

      <OptionPriceRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        productId={productId}
        optionId={optionId}
        rule={editingRule}
        onSuccess={() => {
          setRuleDialogOpen(false)
          setEditingRule(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function PriceRuleCard({
  rule,
  optionId,
  onEdit,
  onDelete,
}: {
  rule: OptionPriceRuleData
  optionId: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{rule.name}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {rule.pricingMode.replace("_", " ")}
            </Badge>
            {rule.isDefault && <Badge variant="secondary">Default</Badge>}
            <Badge variant={rule.active ? "default" : "outline"}>
              {rule.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Base sell:{" "}
              <span className="font-mono text-foreground">
                {(rule.baseSellAmountCents / 100).toFixed(2)}
              </span>
            </span>
            <span>
              Base cost:{" "}
              <span className="font-mono text-foreground">
                {(rule.baseCostAmountCents / 100).toFixed(2)}
              </span>
            </span>
            {rule.allPricingCategories && <span>All categories</span>}
          </div>
        </div>
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </ActionMenu>
      </div>

      <div className="mt-3">
        <UnitPriceMatrix optionPriceRuleId={rule.id} optionId={optionId} />
      </div>
    </div>
  )
}

function UnitPriceMatrix({
  optionPriceRuleId,
  optionId,
}: {
  optionPriceRuleId: string
  optionId: string
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<OptionUnitPriceRuleData | undefined>()
  const [preselectedUnitId, setPreselectedUnitId] = useState<string | undefined>()
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | null | undefined>()

  const { data: unitsData } = useQuery({
    queryKey: ["option-units", optionId],
    queryFn: () => api.get<UnitListResponse>(`/v1/products/units?optionId=${optionId}&limit=100`),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["pricing-categories-global"],
    queryFn: () => api.get<CategoryListResponse>("/v1/pricing/pricing-categories?limit=200"),
  })

  const { data: cellsData, refetch: refetchCells } = useQuery({
    queryKey: ["option-unit-price-rules", optionPriceRuleId],
    queryFn: () =>
      api.get<UnitPriceRuleListResponse>(
        `/v1/pricing/option-unit-price-rules?optionPriceRuleId=${optionPriceRuleId}&limit=200`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/option-unit-price-rules/${id}`),
    onSuccess: () => void refetchCells(),
  })

  const units = (unitsData?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const categories = categoriesData?.data ?? []
  const cells = cellsData?.data ?? []

  const findCell = (unitId: string, categoryId: string | null): OptionUnitPriceRuleData | null => {
    return (
      cells.find((c) => c.unitId === unitId && (c.pricingCategoryId ?? null) === categoryId) ?? null
    )
  }

  if (units.length === 0) {
    return <p className="text-xs italic text-muted-foreground">Add units to configure pricing.</p>
  }

  if (categories.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">
        Create global pricing categories in Settings first.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Unit × Category Pricing
        </p>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="p-2 text-left font-medium">Unit</th>
              {categories.map((cat) => (
                <th key={cat.id} className="p-2 text-left font-medium">
                  {cat.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b last:border-b-0">
                <td className="p-2 font-medium">
                  {unit.name}
                  <span className="ml-1 text-[10px] text-muted-foreground">({unit.unitType})</span>
                </td>
                {categories.map((cat) => {
                  const cell = findCell(unit.id, cat.id)
                  return (
                    <td key={cat.id} className="p-2">
                      {cell ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCell(cell)
                              setPreselectedUnitId(undefined)
                              setPreselectedCategoryId(undefined)
                              setDialogOpen(true)
                            }}
                            className="font-mono text-foreground hover:underline"
                          >
                            {(cell.sellAmountCents / 100).toFixed(2)}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this price cell?")) {
                                deleteMutation.mutate(cell.id)
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCell(undefined)
                            setPreselectedUnitId(unit.id)
                            setPreselectedCategoryId(cat.id)
                            setDialogOpen(true)
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UnitPriceRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        optionPriceRuleId={optionPriceRuleId}
        optionId={optionId}
        units={units}
        preselectedUnitId={preselectedUnitId}
        preselectedCategoryId={preselectedCategoryId}
        cell={editingCell}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingCell(undefined)
          setPreselectedUnitId(undefined)
          setPreselectedCategoryId(undefined)
          void refetchCells()
        }}
      />
    </div>
  )
}
