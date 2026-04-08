import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { Badge, Button, Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import {
  type BookingQuestionData,
  BookingQuestionDialog,
} from "./_components/booking-question-dialog"
import {
  type ContactRequirementData,
  ContactRequirementDialog,
} from "./_components/contact-requirement-dialog"
import {
  type BookingQuestionOptionData,
  QuestionOptionDialog,
} from "./_components/question-option-dialog"

export const Route = createFileRoute("/_workspace/booking-requirements/")({
  component: BookingRequirementsPage,
})

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type ProductLite = { id: string; name: string; code: string | null; status: string }

const SELECT_TYPES = new Set(["single_select", "multi_select"])

function BookingRequirementsPage() {
  const [productId, setProductId] = useState<string>("")

  const productsQuery = useQuery({
    queryKey: ["booking-requirements", "products"],
    queryFn: () => api.get<ListResponse<ProductLite>>("/v1/products?limit=200"),
  })
  const products = productsQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Booking Requirements</h1>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product…" />
          </SelectTrigger>
          <SelectContent>
            {products.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                {productsQuery.isPending ? "Loading…" : "No products"}
              </div>
            )}
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {p.code ? ` · ${p.code}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pick a product to configure traveler data collection.
        </p>
      </div>

      {!productId && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a product above to manage its contact requirements and custom booking questions.
          </p>
        </div>
      )}

      {productId && (
        <Tabs defaultValue="contact-requirements" className="flex flex-col gap-4">
          <TabsList>
            <TabsTrigger value="contact-requirements">Contact Requirements</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          <TabsContent value="contact-requirements">
            <ContactRequirementsTab productId={productId} />
          </TabsContent>
          <TabsContent value="questions">
            <QuestionsTab productId={productId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ContactRequirementsTab({ productId }: { productId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContactRequirementData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["contact-requirements", productId],
    queryFn: () =>
      api.get<ListResponse<ContactRequirementData>>(
        `/v1/booking-requirements/contact-requirements?productId=${productId}&limit=200`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/booking-requirements/contact-requirements/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSort = rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Contact Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Standard traveler fields collected at booking (name, email, passport, etc.).
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Requirement
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No contact requirements yet. Add one to start collecting traveler data.
          </p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Field</th>
                <th className="p-3 text-left font-medium">Scope</th>
                <th className="p-3 text-left font-medium">Required</th>
                <th className="p-3 text-left font-medium">Per Participant</th>
                <th className="p-3 text-left font-medium">Sort</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium capitalize">{row.fieldKey.replace(/_/g, " ")}</td>
                  <td className="p-3 capitalize text-muted-foreground">
                    {row.scope.replace("_", " ")}
                  </td>
                  <td className="p-3">
                    {row.isRequired ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {row.perParticipant ? (
                      <Badge variant="secondary">Yes</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{row.sortOrder}</td>
                  <td className="p-3">
                    <Badge variant={row.active ? "default" : "outline"}>
                      {row.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row)
                          setDialogOpen(true)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete requirement "${row.fieldKey}"?`)) {
                            deleteMutation.mutate(row.id)
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContactRequirementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        requirement={editing}
        nextSortOrder={nextSort}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function QuestionsTab({ productId }: { productId: string }) {
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<BookingQuestionData | undefined>()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const [optionDialogOpen, setOptionDialogOpen] = useState(false)
  const [optionDialogQuestionId, setOptionDialogQuestionId] = useState<string | null>(null)
  const [editingOption, setEditingOption] = useState<BookingQuestionOptionData | undefined>()
  const [nextOptionSort, setNextOptionSort] = useState(0)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["booking-questions", productId],
    queryFn: () =>
      api.get<ListResponse<BookingQuestionData>>(
        `/v1/booking-requirements/questions?productId=${productId}&limit=200`,
      ),
  })

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/booking-requirements/questions/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSort = rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Custom Questions</h2>
          <p className="text-sm text-muted-foreground">
            Product-specific questions asked at booking (dietary needs, preferences, etc.).
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingQuestion(undefined)
            setQuestionDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No questions yet. Add one to collect custom data at booking.
          </p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((q) => (
            <QuestionRow
              key={q.id}
              question={q}
              expanded={expandedIds.has(q.id)}
              onToggle={() => toggleExpand(q.id)}
              onEdit={() => {
                setEditingQuestion(q)
                setQuestionDialogOpen(true)
              }}
              onDelete={() => {
                if (confirm(`Delete question "${q.label}"?`)) {
                  deleteQuestion.mutate(q.id)
                }
              }}
              onAddOption={(sort) => {
                setOptionDialogQuestionId(q.id)
                setEditingOption(undefined)
                setNextOptionSort(sort)
                setOptionDialogOpen(true)
              }}
              onEditOption={(opt) => {
                setOptionDialogQuestionId(q.id)
                setEditingOption(opt)
                setOptionDialogOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <BookingQuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        productId={productId}
        question={editingQuestion}
        nextSortOrder={nextSort}
        onSuccess={() => {
          setQuestionDialogOpen(false)
          setEditingQuestion(undefined)
          void refetch()
        }}
      />

      {optionDialogQuestionId && (
        <QuestionOptionDialog
          open={optionDialogOpen}
          onOpenChange={setOptionDialogOpen}
          questionId={optionDialogQuestionId}
          option={editingOption}
          nextSortOrder={nextOptionSort}
          onSuccess={() => {
            setOptionDialogOpen(false)
            setEditingOption(undefined)
          }}
        />
      )}
    </div>
  )
}

function QuestionRow({
  question,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddOption,
  onEditOption,
}: {
  question: BookingQuestionData
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddOption: (nextSort: number) => void
  onEditOption: (opt: BookingQuestionOptionData) => void
}) {
  const hasChoices = SELECT_TYPES.has(question.fieldType)

  const { data: optionsData, refetch: refetchOptions } = useQuery({
    queryKey: ["question-options", question.id],
    queryFn: () =>
      api.get<ListResponse<BookingQuestionOptionData>>(
        `/v1/booking-requirements/question-options?productBookingQuestionId=${question.id}&limit=100`,
      ),
    enabled: expanded && hasChoices,
  })

  const deleteOption = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/booking-requirements/question-options/${id}`),
    onSuccess: () => {
      void refetchOptions()
    },
  })

  const options = (optionsData?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSort = options.length > 0 ? Math.max(...options.map((o) => o.sortOrder)) + 1 : 0

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
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{question.label}</span>
            {question.code && (
              <span className="font-mono text-xs text-muted-foreground">{question.code}</span>
            )}
            <Badge variant="outline" className="capitalize">
              {question.fieldType.replace("_", " ")}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {question.target.replace("_", " ")}
            </Badge>
            {question.isRequired && <Badge variant="default">Required</Badge>}
            <Badge variant={question.active ? "default" : "outline"}>
              {question.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {question.description && (
            <p className="mt-1 text-xs text-muted-foreground">{question.description}</p>
          )}
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
        <div className="border-t bg-muted/30 p-3">
          {!hasChoices && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              Choice options only apply to single-select / multi-select field types.
            </p>
          )}

          {hasChoices && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Choices
                </p>
                <Button variant="outline" size="sm" onClick={() => onAddOption(nextSort)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Choice
                </Button>
              </div>

              {options.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">No choices yet.</p>
              )}

              {options.length > 0 && (
                <div className="rounded border bg-background">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="p-2 text-left font-medium">Sort</th>
                        <th className="p-2 text-left font-medium">Value</th>
                        <th className="p-2 text-left font-medium">Label</th>
                        <th className="p-2 text-left font-medium">Default</th>
                        <th className="p-2 text-left font-medium">Status</th>
                        <th className="w-16 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((opt) => (
                        <tr key={opt.id} className="border-b last:border-b-0">
                          <td className="p-2 font-mono">{opt.sortOrder}</td>
                          <td className="p-2 font-mono text-muted-foreground">{opt.value}</td>
                          <td className="p-2">{opt.label}</td>
                          <td className="p-2">
                            {opt.isDefault ? (
                              <Badge variant="secondary">Default</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge variant={opt.active ? "default" : "outline"}>
                              {opt.active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditOption(opt)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Delete this choice?")) {
                                    deleteOption.mutate(opt.id)
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
