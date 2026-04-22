"use client"

import {
  type PricingCategoryRecord,
  usePricingCategories,
  usePricingCategoryMutation,
} from "@voyantjs/pricing-react"
import { formatMessage } from "@voyantjs/voyant-admin"
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
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

import { PricingCategoryDialog } from "./pricing-category-dialog"

export interface PricingCategoryListProps {
  pageSize?: number
}

export function PricingCategoryList({ pageSize = 25 }: PricingCategoryListProps = {}) {
  const messages = useAdminMessages()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PricingCategoryRecord | undefined>(undefined)
  const [search, setSearch] = React.useState("")
  const [offset, setOffset] = React.useState(0)

  const { data, isPending, isError } = usePricingCategories({
    limit: pageSize,
    offset,
    search: search || undefined,
    active: undefined,
  })
  const { remove } = usePricingCategoryMutation()

  const categories = data?.data ?? []
  const total = data?.total ?? 0
  const page = Math.floor(offset / pageSize) + 1
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const categoryTypeLabels = React.useMemo(
    () => ({
      adult: messages.pricing.categories.typeAdult,
      child: messages.pricing.categories.typeChild,
      infant: messages.pricing.categories.typeInfant,
      senior: messages.pricing.categories.typeSenior,
      group: messages.pricing.categories.typeGroup,
      room: messages.pricing.categories.typeRoom,
      vehicle: messages.pricing.categories.typeVehicle,
      service: messages.pricing.categories.typeService,
      other: messages.pricing.categories.typeOther,
    }),
    [messages],
  )

  return (
    <div data-slot="pricing-category-list" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={messages.pricing.categories.searchPlaceholder}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setOffset(0)
            }}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          {messages.pricing.categories.newCategory}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{messages.pricing.categories.tableName}</TableHead>
              <TableHead>{messages.pricing.categories.tableCode}</TableHead>
              <TableHead>{messages.pricing.categories.tableType}</TableHead>
              <TableHead>{messages.pricing.categories.tableAge}</TableHead>
              <TableHead>{messages.pricing.categories.tableSeat}</TableHead>
              <TableHead>{messages.pricing.categories.tableSort}</TableHead>
              <TableHead>{messages.pricing.categories.tableStatus}</TableHead>
              <TableHead className="w-[80px] text-right">
                {messages.pricing.categories.tableActions}
              </TableHead>
            </TableRow>
          </TableHeader>
          {isPending ? (
            <SkeletonTableRows
              rows={6}
              columns={8}
              columnWidths={["w-32", "w-20", "w-16", "w-20", "w-10", "w-10", "w-14", "w-8"]}
            />
          ) : isError ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-destructive">
                  {messages.pricing.categories.loadFailed}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : categories.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  {messages.pricing.categories.empty}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {category.code ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {categoryTypeLabels[category.categoryType] ?? category.categoryType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {category.isAgeQualified
                      ? `${category.minAge ?? 0}${messages.pricing.categories.ageRangeSeparator}${category.maxAge ?? messages.pricing.categories.ageRangeOpenEnded}`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono">{category.seatOccupancy}</TableCell>
                  <TableCell className="font-mono">{category.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={category.active ? "default" : "outline"}>
                      {category.active
                        ? messages.pricing.categories.statusActive
                        : messages.pricing.categories.statusInactive}
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
                            setEditing(category)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                          {messages.pricing.categories.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (
                              confirm(
                                messages.pricing.categories.deleteConfirm.replace(
                                  "{name}",
                                  category.name,
                                ),
                              )
                            ) {
                              remove.mutate(category.id)
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                          {messages.pricing.categories.delete}
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {formatMessage(messages.settings.paginationShowing, { count: categories.length, total })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.max(0, prev - pageSize))}
          >
            {messages.settings.paginationPrevious}
          </Button>
          <span>{formatMessage(messages.settings.paginationPage, { page, pageCount })}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + pageSize >= total}
            onClick={() => setOffset((prev) => prev + pageSize)}
          >
            {messages.settings.paginationNext}
          </Button>
        </div>
      </div>

      <PricingCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
    </div>
  )
}
