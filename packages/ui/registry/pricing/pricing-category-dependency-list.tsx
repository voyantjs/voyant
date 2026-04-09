"use client"

import {
  type PricingCategoryDependencyRecord,
  usePricingCategories,
  usePricingCategoryDependencies,
  usePricingCategoryDependencyMutation,
} from "@voyantjs/pricing-react"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { PricingCategoryDependencyDialog } from "./pricing-category-dependency-dialog"

export interface PricingCategoryDependencyListProps {
  pageSize?: number
}

export function PricingCategoryDependencyList({
  pageSize = 200,
}: PricingCategoryDependencyListProps = {}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PricingCategoryDependencyRecord | undefined>(
    undefined,
  )
  const { data, isPending, isError } = usePricingCategoryDependencies({ limit: pageSize })
  const { data: categoriesData } = usePricingCategories({ limit: 200 })
  const { remove } = usePricingCategoryDependencyMutation()

  const dependencies = data?.data ?? []
  const categoryById = new Map(
    (categoriesData?.data ?? []).map((category) => [category.id, category]),
  )

  return (
    <div data-slot="pricing-category-dependency-list" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Category Dependencies</h2>
          <p className="text-sm text-muted-foreground">
            Rules between pricing categories: requires, limits per master, excludes.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          New dependency
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Master</TableHead>
              <TableHead>Dependent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-destructive">
                  Failed to load pricing category dependencies.
                </TableCell>
              </TableRow>
            ) : dependencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No category dependencies found.
                </TableCell>
              </TableRow>
            ) : (
              dependencies.map((dependency) => (
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
                      {dependency.dependencyType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {dependency.maxPerMaster != null
                      ? `per master: ${dependency.maxPerMaster}`
                      : ""}
                    {dependency.maxPerMaster != null && dependency.maxDependentSum != null
                      ? " · "
                      : ""}
                    {dependency.maxDependentSum != null ? `sum: ${dependency.maxDependentSum}` : ""}
                    {dependency.maxPerMaster == null && dependency.maxDependentSum == null
                      ? "—"
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={dependency.active ? "default" : "outline"}>
                      {dependency.active ? "Active" : "Inactive"}
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
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Delete dependency?")) {
                              remove.mutate(dependency.id)
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
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
