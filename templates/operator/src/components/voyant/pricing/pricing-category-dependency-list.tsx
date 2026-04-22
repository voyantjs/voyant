"use client"

import { useQueries } from "@tanstack/react-query"
import {
  getPricingCategoryQueryOptions,
  type PricingCategoryDependencyRecord,
  usePricingCategoryDependencies,
  usePricingCategoryDependencyMutation,
  useVoyantPricingContext,
} from "@voyantjs/pricing-react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SkeletonTableRows } from "@/components/ui/skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminMessages } from "@/lib/admin-i18n"

import { PricingCategoryDependencyDialog } from "./pricing-category-dependency-dialog"

export interface PricingCategoryDependencyListProps {
  pageSize?: number
}

export function PricingCategoryDependencyList({
  pageSize = 200,
}: PricingCategoryDependencyListProps = {}) {
  const messages = useAdminMessages()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PricingCategoryDependencyRecord | undefined>(
    undefined,
  )
  const { data, isPending, isError } = usePricingCategoryDependencies({ limit: pageSize })
  const { remove } = usePricingCategoryDependencyMutation()
  const { baseUrl, fetcher } = useVoyantPricingContext()

  const dependencies = data?.data ?? []
  const categoryIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          dependencies.flatMap((dependency) => [
            dependency.masterPricingCategoryId,
            dependency.pricingCategoryId,
          ]),
        ),
      ),
    [dependencies],
  )
  const categoryQueries = useQueries({
    queries: categoryIds.map((id) => getPricingCategoryQueryOptions({ baseUrl, fetcher }, id)),
  })
  const categoryById = React.useMemo(() => {
    const map = new Map<string, { name: string }>()
    categoryQueries.forEach((query, index) => {
      if (query.data) map.set(categoryIds[index], query.data)
    })
    return map
  }, [categoryIds, categoryQueries])

  return (
    <div data-slot="pricing-category-dependency-list" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{messages.pricing.dependencies.title}</h2>
          <p className="text-sm text-muted-foreground">
            {messages.pricing.dependencies.description}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          {messages.pricing.dependencies.newDependency}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{messages.pricing.dependencies.tableMaster}</TableHead>
              <TableHead>{messages.pricing.dependencies.tableDependent}</TableHead>
              <TableHead>{messages.pricing.dependencies.tableType}</TableHead>
              <TableHead>{messages.pricing.dependencies.tableLimits}</TableHead>
              <TableHead>{messages.pricing.dependencies.tableStatus}</TableHead>
              <TableHead className="w-[80px] text-right">
                {messages.pricing.dependencies.tableActions}
              </TableHead>
            </TableRow>
          </TableHeader>
          {isPending ? (
            <SkeletonTableRows
              rows={6}
              columns={6}
              columnWidths={["w-28", "w-28", "w-24", "w-32", "w-16", "w-8"]}
            />
          ) : isError ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-destructive">
                  {messages.pricing.dependencies.loadFailed}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : dependencies.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  {messages.pricing.dependencies.empty}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {dependencies.map((dependency) => (
                <TableRow key={dependency.id}>
                  <TableCell className="text-muted-foreground">
                    {categoryById.get(dependency.masterPricingCategoryId)?.name ??
                      dependency.masterPricingCategoryId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {categoryById.get(dependency.pricingCategoryId)?.name ??
                      dependency.pricingCategoryId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {dependency.dependencyType === "requires"
                        ? messages.pricing.dependencies.typeRequires
                        : dependency.dependencyType === "limits_per_master"
                          ? messages.pricing.dependencies.typeLimitsPerMaster
                          : dependency.dependencyType === "limits_sum"
                            ? messages.pricing.dependencies.typeLimitsSum
                            : messages.pricing.dependencies.typeExcludes}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {dependency.maxPerMaster != null
                      ? `${messages.pricing.dependencies.limitPerMasterPrefix}: ${dependency.maxPerMaster}`
                      : ""}
                    {dependency.maxPerMaster != null && dependency.maxDependentSum != null
                      ? " · "
                      : ""}
                    {dependency.maxDependentSum != null
                      ? `${messages.pricing.dependencies.limitSumPrefix}: ${dependency.maxDependentSum}`
                      : ""}
                    {dependency.maxPerMaster == null && dependency.maxDependentSum == null
                      ? "—"
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={dependency.active ? "default" : "outline"}>
                      {dependency.active
                        ? messages.pricing.dependencies.statusActive
                        : messages.pricing.dependencies.statusInactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(dependency)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                          {messages.pricing.dependencies.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (confirm(messages.pricing.dependencies.deleteConfirm)) {
                              remove.mutate(dependency.id)
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                          {messages.pricing.dependencies.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <PricingCategoryDependencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dependency={editing}
      />
    </div>
  )
}
