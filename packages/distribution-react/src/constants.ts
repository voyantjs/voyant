export const NONE_VALUE = "__none__"

export const channelKindOptions = [
  { value: "direct", label: "Direct" },
  { value: "affiliate", label: "Affiliate" },
  { value: "ota", label: "OTA" },
  { value: "reseller", label: "Reseller" },
  { value: "marketplace", label: "Marketplace" },
  { value: "api_partner", label: "API Partner" },
] as const

export const channelStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
] as const

export const contractStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
] as const

export const paymentOwnerOptions = [
  { value: "operator", label: "Operator" },
  { value: "channel", label: "Channel" },
  { value: "split", label: "Split" },
] as const

export const cancellationOwnerOptions = [
  { value: "operator", label: "Operator" },
  { value: "channel", label: "Channel" },
  { value: "mixed", label: "Mixed" },
] as const

export const commissionScopeOptions = [
  { value: "booking", label: "Booking" },
  { value: "product", label: "Product" },
  { value: "rate", label: "Rate" },
  { value: "category", label: "Category" },
] as const

export const commissionTypeOptions = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "Percentage" },
] as const

export const webhookStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "failed", label: "Failed" },
  { value: "ignored", label: "Ignored" },
] as const
