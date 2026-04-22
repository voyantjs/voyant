"use client"

import {
  type ProductTagRecord,
  useProductTagMutation,
  useProductTags,
} from "@voyantjs/products-react"
import { formatMessage } from "@voyantjs/voyant-admin"
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
import * as React from "react"

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

import { ProductTagDialog } from "./product-tag-dialog"

export interface ProductTagListProps {
  pageSize?: number
}

export function ProductTagList({ pageSize = 200 }: ProductTagListProps = {}) {
  const messages = useAdminMessages()
  const tagMessages = messages.products.taxonomy.tags
  const [search, setSearch] = React.useState("")
  const [offset, setOffset] = React.useState(0)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ProductTagRecord | undefined>(undefined)
  const { data, isPending, isError } = useProductTags({
    search: search || undefined,
    limit: pageSize,
    offset,
  })
  const { remove } = useProductTagMutation()

  const tags = data?.data ?? []
  const total = data?.total ?? 0
  const page = Math.floor(offset / pageSize) + 1
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div data-slot="product-tag-list" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tagMessages.searchPlaceholder}
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
          <Plus className="mr-2 size-4" aria-hidden="true" />
          {tagMessages.addTag}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tagMessages.tableName}</TableHead>
              <TableHead className="w-[80px] text-right">{tagMessages.tableActions}</TableHead>
            </TableRow>
          </TableHeader>
          {isPending ? (
            <SkeletonTableRows rows={6} columns={2} columnWidths={["w-40", "w-8"]} />
          ) : isError ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-sm text-destructive">
                  {tagMessages.loadFailed}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : tags.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-sm text-muted-foreground">
                  {tagMessages.empty}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(tag)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                          {tagMessages.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (
                              confirm(
                                formatMessage(tagMessages.deleteConfirm, {
                                  name: tag.name,
                                }),
                              )
                            ) {
                              remove.mutate(tag.id)
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                          {tagMessages.delete}
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
          {formatMessage(messages.settings.paginationShowing, {
            count: tags.length,
            total,
          })}
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

      <ProductTagDialog open={dialogOpen} onOpenChange={setDialogOpen} tag={editing} />
    </div>
  )
}
