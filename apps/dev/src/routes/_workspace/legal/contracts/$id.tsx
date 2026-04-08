import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { AttachmentDialog } from "./_components/attachment-dialog"
import { ContractDialog } from "./_components/contract-dialog"
import { SignatureDialog } from "./_components/signature-dialog"

type Contract = {
  id: string
  contractNumber: string | null
  scope: "customer" | "supplier" | "partner" | "channel" | "other"
  status: "draft" | "issued" | "sent" | "signed" | "executed" | "expired" | "void"
  title: string
  language: string
  templateVersionId: string | null
  seriesId: string | null
  personId: string | null
  organizationId: string | null
  supplierId: string | null
  channelId: string | null
  expiresAt: string | null
  renderedBody: string | null
  variables: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

type Signature = {
  id: string
  signerName: string
  signerEmail: string | null
  signerRole: string | null
  method: string
  signedAt: string
}

type Attachment = {
  id: string
  name: string
  kind: string
  mimeType: string | null
  fileSize: number | null
  storageKey: string | null
  checksum: string | null
}

export const Route = createFileRoute("/_workspace/legal/contracts/$id")({
  component: ContractDetailPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  issued: "secondary",
  sent: "secondary",
  signed: "default",
  executed: "default",
  expired: "destructive",
  void: "destructive",
}

function ContractDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [signOpen, setSignOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [editingAttachment, setEditingAttachment] = useState<Attachment | undefined>()

  const { data: contractData, isPending } = useQuery({
    queryKey: queryKeys.legal.contracts.detail(id),
    queryFn: () => api.get<{ data: Contract }>(`/v1/admin/legal/contracts/${id}`),
  })

  const { data: signaturesData, refetch: refetchSignatures } = useQuery({
    queryKey: queryKeys.legal.contracts.signatures(id),
    queryFn: () => api.get<{ data: Signature[] }>(`/v1/admin/legal/contracts/${id}/signatures`),
  })

  const { data: attachmentsData, refetch: refetchAttachments } = useQuery({
    queryKey: queryKeys.legal.contracts.attachments(id),
    queryFn: () => api.get<{ data: Attachment[] }>(`/v1/admin/legal/contracts/${id}/attachments`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/admin/legal/contracts/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.legal.contracts.all })
      void navigate({ to: "/legal/contracts" })
    },
  })

  const lifecycleMutation = useMutation({
    mutationFn: (action: string) => api.post(`/v1/admin/legal/contracts/${id}/${action}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.legal.contracts.detail(id) })
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete(`/v1/admin/legal/contracts/attachments/${attachmentId}`),
    onSuccess: () => {
      void refetchAttachments()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const contract = contractData?.data
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Contract not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/legal/contracts" })}>
          Back to Contracts
        </Button>
      </div>
    )
  }

  const status = contract.status

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate({ to: "/legal/contracts" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {contract.scope}
            </Badge>
            <Badge variant={statusVariant[status] ?? "secondary"} className="capitalize">
              {status}
            </Badge>
            {contract.contractNumber && (
              <span className="font-mono text-xs text-muted-foreground">
                {contract.contractNumber}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {status === "draft" && (
            <Button
              size="sm"
              onClick={() => lifecycleMutation.mutate("issue")}
              disabled={lifecycleMutation.isPending}
            >
              Issue
            </Button>
          )}
          {status === "issued" && (
            <Button
              size="sm"
              onClick={() => lifecycleMutation.mutate("send")}
              disabled={lifecycleMutation.isPending}
            >
              Send
            </Button>
          )}
          {(status === "issued" || status === "sent") && (
            <Button size="sm" onClick={() => setSignOpen(true)}>
              Sign
            </Button>
          )}
          {status === "signed" && (
            <Button
              size="sm"
              onClick={() => lifecycleMutation.mutate("execute")}
              disabled={lifecycleMutation.isPending}
            >
              Execute
            </Button>
          )}
          {status !== "void" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm("Void this contract?")) {
                  lifecycleMutation.mutate("void")
                }
              }}
              disabled={lifecycleMutation.isPending}
            >
              Void
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {status === "draft" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this contract?")) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Language:</span>{" "}
              <span>{contract.language}</span>
            </div>
            {contract.templateVersionId && (
              <div>
                <span className="text-muted-foreground">Template Version:</span>{" "}
                <span className="font-mono text-xs">{contract.templateVersionId}</span>
              </div>
            )}
            {contract.seriesId && (
              <div>
                <span className="text-muted-foreground">Series:</span>{" "}
                <span className="font-mono text-xs">{contract.seriesId}</span>
              </div>
            )}
            {contract.expiresAt && (
              <div>
                <span className="text-muted-foreground">Expires:</span>{" "}
                <span>{new Date(contract.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-2">
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{" "}
                <span>{new Date(contract.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {contract.personId && (
              <div>
                <span className="text-muted-foreground">Person:</span>{" "}
                <span className="font-mono text-xs">{contract.personId}</span>
              </div>
            )}
            {contract.organizationId && (
              <div>
                <span className="text-muted-foreground">Organization:</span>{" "}
                <span className="font-mono text-xs">{contract.organizationId}</span>
              </div>
            )}
            {contract.supplierId && (
              <div>
                <span className="text-muted-foreground">Supplier:</span>{" "}
                <span className="font-mono text-xs">{contract.supplierId}</span>
              </div>
            )}
            {contract.channelId && (
              <div>
                <span className="text-muted-foreground">Channel:</span>{" "}
                <span className="font-mono text-xs">{contract.channelId}</span>
              </div>
            )}
            {!contract.personId &&
              !contract.organizationId &&
              !contract.supplierId &&
              !contract.channelId && <p className="text-muted-foreground">No parties assigned.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Rendered Body Preview */}
      {contract.renderedBody && (
        <Card>
          <CardHeader>
            <CardTitle>Rendered Body</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap text-sm">{contract.renderedBody}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Signatures</CardTitle>
          {(status === "issued" || status === "sent" || status === "signed") && (
            <Button size="sm" onClick={() => setSignOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Signature
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(!signaturesData?.data || signaturesData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No signatures yet.</p>
          )}
          {signaturesData?.data && signaturesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Role</th>
                    <th className="text-left p-2 font-medium">Method</th>
                    <th className="text-left p-2 font-medium">Signed At</th>
                  </tr>
                </thead>
                <tbody>
                  {signaturesData.data.map((sig) => (
                    <tr key={sig.id} className="border-b last:border-b-0">
                      <td className="p-2">{sig.signerName}</td>
                      <td className="p-2">{sig.signerEmail ?? "-"}</td>
                      <td className="p-2">{sig.signerRole ?? "-"}</td>
                      <td className="p-2 capitalize">{sig.method}</td>
                      <td className="p-2">{new Date(sig.signedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attachments</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingAttachment(undefined)
              setAttachOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Attachment
          </Button>
        </CardHeader>
        <CardContent>
          {(!attachmentsData?.data || attachmentsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No attachments yet.</p>
          )}
          {attachmentsData?.data && attachmentsData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Kind</th>
                    <th className="text-left p-2 font-medium">MIME Type</th>
                    <th className="text-left p-2 font-medium">Size</th>
                    <th className="p-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {attachmentsData.data.map((att) => (
                    <tr key={att.id} className="border-b last:border-b-0">
                      <td className="p-2">{att.name}</td>
                      <td className="p-2">{att.kind}</td>
                      <td className="p-2">{att.mimeType ?? "-"}</td>
                      <td className="p-2">{att.fileSize ? `${att.fileSize} B` : "-"}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAttachment(att)
                              setAttachOpen(true)
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this attachment?")) {
                                deleteAttachmentMutation.mutate(att.id)
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ContractDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contract={contract}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: queryKeys.legal.contracts.detail(id) })
          void queryClient.invalidateQueries({ queryKey: queryKeys.legal.contracts.all })
        }}
      />

      <SignatureDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        contractId={id}
        onSuccess={() => {
          setSignOpen(false)
          void refetchSignatures()
          void queryClient.invalidateQueries({ queryKey: queryKeys.legal.contracts.detail(id) })
        }}
      />

      <AttachmentDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        contractId={id}
        attachment={editingAttachment}
        onSuccess={() => {
          setAttachOpen(false)
          setEditingAttachment(undefined)
          void refetchAttachments()
        }}
      />
    </div>
  )
}
