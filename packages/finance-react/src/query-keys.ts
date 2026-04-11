export interface FinanceInvoiceListFilters {
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface FinanceSupplierPaymentListFilters {
  limit?: number | undefined
  offset?: number | undefined
}

export const financeQueryKeys = {
  all: ["voyant", "finance"] as const,

  invoices: () => [...financeQueryKeys.all, "invoices"] as const,
  invoicesList: (filters: FinanceInvoiceListFilters) =>
    [...financeQueryKeys.invoices(), "list", filters] as const,
  invoice: (id: string) => [...financeQueryKeys.invoices(), "detail", id] as const,
  lineItems: (invoiceId: string) => [...financeQueryKeys.invoice(invoiceId), "line-items"] as const,
  payments: (invoiceId: string) => [...financeQueryKeys.invoice(invoiceId), "payments"] as const,
  creditNotes: (invoiceId: string) =>
    [...financeQueryKeys.invoice(invoiceId), "credit-notes"] as const,
  notes: (invoiceId: string) => [...financeQueryKeys.invoice(invoiceId), "notes"] as const,

  supplierPayments: () => [...financeQueryKeys.all, "supplier-payments"] as const,
  supplierPaymentsList: (filters: FinanceSupplierPaymentListFilters) =>
    [...financeQueryKeys.supplierPayments(), "list", filters] as const,
} as const
