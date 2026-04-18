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
} from "@/components/ui"
import { DatePicker } from "@/components/ui/date-picker"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"
import type {
  ChannelCommissionRuleRow,
  ChannelContractRow,
  ProductOption,
} from "./distribution-shared"
import {
  commissionScopeOptions,
  commissionTypeOptions,
  NONE_VALUE,
  nullableNumber,
  nullableString,
} from "./distribution-shared"

const commissionFormSchema = z.object({
  contractId: z.string().min(1, "Contract is required"),
  scope: z.enum(["booking", "product", "rate", "category"]),
  productId: z.string().optional(),
  externalRateId: z.string().optional(),
  externalCategoryId: z.string().optional(),
  commissionType: z.enum(["fixed", "percentage"]),
  amountCents: z.string().optional(),
  percentBasisPoints: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
})

export function ChannelCommissionRuleDialog({
  open,
  onOpenChange,
  commissionRule,
  contracts,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  commissionRule?: ChannelCommissionRuleRow
  contracts: ChannelContractRow[]
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      contractId: "",
      scope: "booking" as const,
      productId: NONE_VALUE,
      externalRateId: "",
      externalCategoryId: "",
      commissionType: "percentage" as const,
      amountCents: "",
      percentBasisPoints: "",
      validFrom: "",
      validTo: "",
    },
  })

  useEffect(() => {
    if (open && commissionRule) {
      form.reset({
        contractId: commissionRule.contractId,
        scope: commissionRule.scope,
        productId: commissionRule.productId ?? NONE_VALUE,
        externalRateId: commissionRule.externalRateId ?? "",
        externalCategoryId: commissionRule.externalCategoryId ?? "",
        commissionType: commissionRule.commissionType,
        amountCents: commissionRule.amountCents?.toString() ?? "",
        percentBasisPoints: commissionRule.percentBasisPoints?.toString() ?? "",
        validFrom: commissionRule.validFrom ?? "",
        validTo: commissionRule.validTo ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [commissionRule, form, open])

  const isEditing = Boolean(commissionRule)

  const onSubmit = async (values: z.output<typeof commissionFormSchema>) => {
    const payload = {
      contractId: values.contractId,
      scope: values.scope,
      productId: values.productId === NONE_VALUE ? null : values.productId,
      externalRateId: nullableString(values.externalRateId),
      externalCategoryId: nullableString(values.externalCategoryId),
      commissionType: values.commissionType,
      amountCents: nullableNumber(values.amountCents),
      percentBasisPoints: nullableNumber(values.percentBasisPoints),
      validFrom: nullableString(values.validFrom),
      validTo: nullableString(values.validTo),
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/commission-rules/${commissionRule?.id}`, payload)
    } else {
      await api.post("/v1/distribution/commission-rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Commission Rule" : "New Commission Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contract</Label>
                <Select
                  value={form.watch("contractId")}
                  onValueChange={(value) => form.setValue("contractId", value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Scope</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(value) =>
                    form.setValue("scope", value as ChannelCommissionRuleRow["scope"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionScopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select
                  value={form.watch("productId")}
                  onValueChange={(value) => form.setValue("productId", value ?? NONE_VALUE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No product</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Commission Type</Label>
                <Select
                  value={form.watch("commissionType")}
                  onValueChange={(value) =>
                    form.setValue(
                      "commissionType",
                      value as ChannelCommissionRuleRow["commissionType"],
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount Cents</Label>
                <Input {...form.register("amountCents")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Percent Basis Points</Label>
                <Input {...form.register("percentBasisPoints")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>External Rate ID</Label>
                <Input {...form.register("externalRateId")} placeholder="RACK-STD" />
              </div>
              <div className="grid gap-2">
                <Label>External Category ID</Label>
                <Input {...form.register("externalCategoryId")} placeholder="adult" />
              </div>
              <div className="grid gap-2">
                <Label>Valid From</Label>
                <DatePicker
                  value={form.watch("validFrom") || null}
                  onChange={(next) =>
                    form.setValue("validFrom", next ?? "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  placeholder="Select start date"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label>Valid To</Label>
                <DatePicker
                  value={form.watch("validTo") || null}
                  onChange={(next) =>
                    form.setValue("validTo", next ?? "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  placeholder="Select end date"
                  className="w-full"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
