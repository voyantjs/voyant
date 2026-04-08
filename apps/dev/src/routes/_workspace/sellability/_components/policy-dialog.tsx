import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui"
import { EntityCombobox } from "@/components/ui/entity-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ProductRef = { id: string; name: string; status?: string | null }
type ProductOptionRef = { id: string; name: string; code?: string | null }
type MarketRef = { id: string; name: string; code?: string | null; defaultCurrency?: string | null }
type ChannelRef = { id: string; name: string; code?: string | null; kind?: string | null }

const POLICY_SCOPES = ["global", "product", "option", "market", "channel"] as const
const POLICY_TYPES = [
  "capability",
  "occupancy",
  "pickup",
  "question",
  "allotment",
  "availability_window",
  "currency",
  "custom",
] as const

type PolicyScope = (typeof POLICY_SCOPES)[number]
type PolicyType = (typeof POLICY_TYPES)[number]

const jsonStringSchema = z.string().refine(
  (v) => {
    if (!v || v.trim() === "") return true
    try {
      const parsed = JSON.parse(v)
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    } catch {
      return false
    }
  },
  { message: "Must be a JSON object" },
)

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  scope: z.enum(POLICY_SCOPES),
  policyType: z.enum(POLICY_TYPES),
  productId: z.string().optional().nullable(),
  optionId: z.string().optional().nullable(),
  marketId: z.string().optional().nullable(),
  channelId: z.string().optional().nullable(),
  priority: z.coerce.number().int(),
  active: z.boolean(),
  conditionsJson: jsonStringSchema,
  effectsJson: jsonStringSchema,
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type PolicyData = {
  id: string
  name: string
  scope: PolicyScope
  policyType: PolicyType
  productId: string | null
  optionId: string | null
  marketId: string | null
  channelId: string | null
  priority: number
  active: boolean
  conditions: Record<string, unknown>
  effects: Record<string, unknown>
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: PolicyData
  onSuccess: () => void
}

export function PolicyDialog({ open, onOpenChange, policy, onSuccess }: Props) {
  const isEditing = !!policy

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      scope: "global",
      policyType: "custom",
      productId: "",
      optionId: "",
      marketId: "",
      channelId: "",
      priority: 0,
      active: true,
      conditionsJson: "{}",
      effectsJson: "{}",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && policy) {
      form.reset({
        name: policy.name,
        scope: policy.scope,
        policyType: policy.policyType,
        productId: policy.productId ?? "",
        optionId: policy.optionId ?? "",
        marketId: policy.marketId ?? "",
        channelId: policy.channelId ?? "",
        priority: policy.priority,
        active: policy.active,
        conditionsJson: JSON.stringify(policy.conditions ?? {}, null, 2),
        effectsJson: JSON.stringify(policy.effects ?? {}, null, 2),
        notes: policy.notes ?? "",
      })
    } else if (open) {
      form.reset({
        name: "",
        scope: "global",
        policyType: "custom",
        productId: "",
        optionId: "",
        marketId: "",
        channelId: "",
        priority: 0,
        active: true,
        conditionsJson: "{}",
        effectsJson: "{}",
        notes: "",
      })
    }
  }, [open, policy, form])

  const onSubmit = async (values: FormOutput) => {
    const parseJson = (s: string): Record<string, unknown> => {
      if (!s || s.trim() === "") return {}
      return JSON.parse(s) as Record<string, unknown>
    }
    const payload = {
      name: values.name,
      scope: values.scope,
      policyType: values.policyType,
      productId: values.productId || null,
      optionId: values.optionId || null,
      marketId: values.marketId || null,
      channelId: values.channelId || null,
      priority: values.priority,
      active: values.active,
      conditions: parseJson(values.conditionsJson),
      effects: parseJson(values.effectsJson),
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/sellability/policies/${policy.id}`, payload)
    } else {
      await api.post("/v1/sellability/policies", payload)
    }
    onSuccess()
  }

  const scope = form.watch("scope")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Policy" : "Add Policy"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Block bookings without capability" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Scope</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(v) => form.setValue("scope", v as PolicyScope)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_SCOPES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("policyType")}
                  onValueChange={(v) => form.setValue("policyType", v as PolicyType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Input {...form.register("priority")} type="number" />
              </div>
            </div>

            {scope === "product" && (
              <div className="flex flex-col gap-2">
                <Label>Product</Label>
                <EntityCombobox<ProductRef>
                  value={form.watch("productId") ?? null}
                  onChange={(id) => form.setValue("productId", id)}
                  endpoint="/v1/products?limit=200"
                  queryKey={["products", "picker"]}
                  getLabel={(p) => p.name}
                  getSecondary={(p) => p.status ?? undefined}
                  placeholder="Search products…"
                  emptyText="No products found."
                />
              </div>
            )}
            {scope === "option" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Product</Label>
                  <EntityCombobox<ProductRef>
                    value={form.watch("productId") ?? null}
                    onChange={(id) => {
                      form.setValue("productId", id)
                      form.setValue("optionId", "")
                    }}
                    endpoint="/v1/products?limit=200"
                    queryKey={["products", "picker"]}
                    getLabel={(p) => p.name}
                    getSecondary={(p) => p.status ?? undefined}
                    placeholder="Search products…"
                    emptyText="No products found."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Option</Label>
                  <EntityCombobox<ProductOptionRef>
                    value={form.watch("optionId") ?? null}
                    onChange={(id) => form.setValue("optionId", id)}
                    endpoint={`/v1/products/options?productId=${form.watch("productId") ?? ""}&limit=200`}
                    queryKey={["products", "options", "picker", form.watch("productId") ?? ""]}
                    getLabel={(o) => o.name}
                    getSecondary={(o) => o.code ?? undefined}
                    placeholder="Search options…"
                    emptyText="No options found."
                    disabled={!form.watch("productId")}
                  />
                </div>
              </div>
            )}
            {scope === "market" && (
              <div className="flex flex-col gap-2">
                <Label>Market</Label>
                <EntityCombobox<MarketRef>
                  value={form.watch("marketId") ?? null}
                  onChange={(id) => form.setValue("marketId", id)}
                  endpoint="/v1/markets/markets?limit=200"
                  queryKey={["markets", "picker"]}
                  getLabel={(m) => m.name}
                  getSecondary={(m) =>
                    [m.code, m.defaultCurrency].filter(Boolean).join(" · ") || undefined
                  }
                  placeholder="Search markets…"
                  emptyText="No markets found."
                />
              </div>
            )}
            {scope === "channel" && (
              <div className="flex flex-col gap-2">
                <Label>Channel</Label>
                <EntityCombobox<ChannelRef>
                  value={form.watch("channelId") ?? null}
                  onChange={(id) => form.setValue("channelId", id)}
                  endpoint="/v1/distribution/channels?limit=200"
                  queryKey={["distribution", "channels", "picker"]}
                  getLabel={(c) => c.name}
                  getSecondary={(c) => [c.code, c.kind].filter(Boolean).join(" · ") || undefined}
                  placeholder="Search channels…"
                  emptyText="No channels found."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Conditions (JSON)</Label>
                <Textarea
                  {...form.register("conditionsJson")}
                  rows={6}
                  className="font-mono text-xs"
                />
                {form.formState.errors.conditionsJson && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.conditionsJson.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Effects (JSON)</Label>
                <Textarea
                  {...form.register("effectsJson")}
                  rows={6}
                  className="font-mono text-xs"
                />
                {form.formState.errors.effectsJson && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.effectsJson.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
              <Label>Active</Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
