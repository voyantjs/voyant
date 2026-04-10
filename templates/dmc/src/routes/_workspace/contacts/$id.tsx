import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"

import { api } from "@/lib/api-client"

import { ContactDialog } from "./_components/contact-dialog"

type Contact = {
  id: string
  type: "individual" | "company"
  relation: "client" | "partner" | "supplier" | "other"
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  preferredLanguage: string | null
  preferredCurrency: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

type ContactNote = {
  id: string
  contactId: string
  authorId: string
  content: string
  createdAt: string
}

export const Route = createFileRoute("/_workspace/contacts/$id")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(getContactQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getContactNotesQueryOptions(params.id)),
    ])
  },
  component: ContactDetailPage,
})

function getContactQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["contact", id],
    queryFn: () => api.get<{ data: Contact }>(`/v1/contacts/${id}`),
  })
}

function getContactNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["contact-notes", id],
    queryFn: () => api.get<{ data: ContactNote[] }>(`/v1/contacts/${id}/notes`),
  })
}

function ContactDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")

  const { data: contactData, isPending } = useQuery(getContactQueryOptions(id))

  const { data: notesData, refetch: refetchNotes } = useQuery(getContactNotesQueryOptions(id))

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/contacts/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contacts"] })
      void navigate({ to: "/contacts" })
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/v1/contacts/${id}/notes`, { content }),
    onSuccess: () => {
      setNoteContent("")
      void refetchNotes()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const contact = contactData?.data
  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Contact not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/contacts" })}>
          Back to Contacts
        </Button>
      </div>
    )
  }

  const displayName =
    contact.type === "company"
      ? (contact.companyName ?? "Unnamed Company")
      : [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed Contact"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/contacts" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {contact.type}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {contact.relation}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this contact?")) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {contact.email && (
              <div>
                <span className="text-muted-foreground">Email:</span> <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div>
                <span className="text-muted-foreground">Phone:</span> <span>{contact.phone}</span>
              </div>
            )}
            {contact.website && (
              <div>
                <span className="text-muted-foreground">Website:</span>{" "}
                <span>{contact.website}</span>
              </div>
            )}
            {contact.address && (
              <div>
                <span className="text-muted-foreground">Address:</span>{" "}
                <span>{contact.address}</span>
              </div>
            )}
            {contact.city && (
              <div>
                <span className="text-muted-foreground">City:</span> <span>{contact.city}</span>
              </div>
            )}
            {contact.country && (
              <div>
                <span className="text-muted-foreground">Country:</span>{" "}
                <span>{contact.country}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {contact.preferredLanguage && (
              <div>
                <span className="text-muted-foreground">Language:</span>{" "}
                <span>{contact.preferredLanguage}</span>
              </div>
            )}
            {contact.preferredCurrency && (
              <div>
                <span className="text-muted-foreground">Currency:</span>{" "}
                <span>{contact.preferredCurrency}</span>
              </div>
            )}
            {contact.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground">Tags:</span>{" "}
                <span className="flex flex-wrap gap-1 mt-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{" "}
              <span>{new Date(contact.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="self-end"
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteContent.trim())}
            >
              {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>

          {notesData?.data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
          )}

          {notesData?.data.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <ContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: ["contact", id] })
          void queryClient.invalidateQueries({ queryKey: ["contacts"] })
        }}
      />
    </div>
  )
}
