import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"
import { Hono } from "hono"

import { financeRoutes } from "./routes.js"
import {
  createFinanceAdminDocumentRoutes,
  type FinanceDocumentRouteOptions,
} from "./routes-documents.js"
import { publicFinanceRoutes } from "./routes-public.js"
import {
  createFinanceAdminSettlementRoutes,
  type FinanceSettlementRouteOptions,
} from "./routes-settlement.js"

export type { FinanceRoutes } from "./routes.js"
export type { PublicFinanceRoutes } from "./routes-public.js"
export { publicFinanceRoutes } from "./routes-public.js"
export { publicFinanceService } from "./service-public.js"

export const invoiceLinkable: LinkableDefinition = {
  module: "finance",
  entity: "invoice",
  table: "invoices",
  idPrefix: "inv",
}

export const invoiceTemplateLinkable: LinkableDefinition = {
  module: "finance",
  entity: "invoiceTemplate",
  table: "invoice_templates",
  idPrefix: "invt",
}

export const creditNoteLinkable: LinkableDefinition = {
  module: "finance",
  entity: "creditNote",
  table: "credit_notes",
  idPrefix: "crnt",
}

export const financeLinkable = {
  invoice: invoiceLinkable,
  invoiceTemplate: invoiceTemplateLinkable,
  creditNote: creditNoteLinkable,
}

export const financeModule: Module = {
  name: "finance",
  linkable: financeLinkable,
}

export interface FinanceHonoModuleOptions
  extends FinanceDocumentRouteOptions,
    FinanceSettlementRouteOptions {}

export function createFinanceHonoModule(options: FinanceHonoModuleOptions = {}): HonoModule {
  const adminRoutes = new Hono()
    .route("/", financeRoutes)
    .route("/", createFinanceAdminDocumentRoutes(options))
    .route("/", createFinanceAdminSettlementRoutes(options))

  return {
    module: financeModule,
    adminRoutes,
    publicRoutes: publicFinanceRoutes,
    routes: adminRoutes,
  }
}

export const financeHonoModule: HonoModule = createFinanceHonoModule()

export {
  createFinanceAdminDocumentRoutes,
  type FinanceDocumentRouteOptions,
  type InvoiceDocumentGenerator,
} from "./routes-documents.js"
export {
  createFinanceAdminSettlementRoutes,
  type FinanceSettlementRouteOptions,
  type InvoiceSettlementPoller,
} from "./routes-settlement.js"
export type {
  BookingGuarantee,
  BookingItemCommission,
  BookingItemTaxLine,
  BookingPaymentSchedule,
  CreditNote,
  CreditNoteLineItem,
  FinanceNote,
  Invoice,
  InvoiceExternalRef,
  InvoiceLineItem,
  InvoiceNumberSeries,
  InvoiceRendition,
  InvoiceTemplate,
  NewBookingGuarantee,
  NewBookingItemCommission,
  NewBookingItemTaxLine,
  NewBookingPaymentSchedule,
  NewCreditNote,
  NewCreditNoteLineItem,
  NewFinanceNote,
  NewInvoice,
  NewInvoiceExternalRef,
  NewInvoiceLineItem,
  NewInvoiceNumberSeries,
  NewInvoiceRendition,
  NewInvoiceTemplate,
  NewPayment,
  NewPaymentAuthorization,
  NewPaymentCapture,
  NewPaymentInstrument,
  NewPaymentSession,
  NewSupplierPayment,
  NewTaxRegime,
  Payment,
  PaymentAuthorization,
  PaymentCapture,
  PaymentInstrument,
  PaymentSession,
  SupplierPayment,
  TaxRegime,
} from "./schema.js"
export {
  bookingGuarantees,
  bookingItemCommissions,
  bookingItemTaxLines,
  bookingPaymentSchedules,
  creditNoteLineItems,
  creditNotes,
  financeNotes,
  invoiceExternalRefs,
  invoiceLineItems,
  invoiceNumberSeries,
  invoiceRenditions,
  invoices,
  invoiceTemplates,
  paymentAuthorizations,
  paymentCaptures,
  paymentInstruments,
  paymentSessions,
  payments,
  supplierPayments,
  taxRegimes,
} from "./schema.js"
export type { InvoiceFromBookingData } from "./service.js"
export { financeService, renderInvoiceBody } from "./service.js"
export type {
  GeneratedInvoiceDocumentRecord,
  GeneratedInvoiceRenditionArtifact,
  InvoiceDocumentGeneratorContext,
  InvoiceDocumentRuntimeOptions,
  StorageBackedInvoiceDocumentGeneratorOptions,
  StorageBackedInvoiceDocumentSerializer,
  StorageBackedInvoiceDocumentUpload,
} from "./service-documents.js"
export {
  createPdfInvoiceDocumentGenerator,
  createStorageBackedInvoiceDocumentGenerator,
  defaultPdfInvoiceDocumentSerializer,
  defaultStorageBackedInvoiceDocumentSerializer,
  financeDocumentsService,
} from "./service-documents.js"
export type {
  FinanceSettlementRuntimeOptions,
  InvoiceSettlementPollerContext,
  InvoiceSettlementPollerResult,
} from "./service-settlement.js"
export { financeSettlementService } from "./service-settlement.js"
export type {
  GeneratedInvoiceDocumentResult,
  GenerateInvoiceDocumentInput,
  PolledInvoiceSettlementResult,
  PollInvoiceSettlementInput,
} from "./validation.js"
export {
  agingReportQuerySchema,
  allocateInvoiceNumberInputSchema,
  applyDefaultBookingPaymentPlanSchema,
  cancelPaymentSessionSchema,
  completePaymentSessionSchema,
  createPaymentSessionFromGuaranteeSchema,
  createPaymentSessionFromInvoiceSchema,
  createPaymentSessionFromScheduleSchema,
  expirePaymentSessionSchema,
  failPaymentSessionSchema,
  generatedInvoiceDocumentResultSchema,
  generateInvoiceDocumentInputSchema,
  insertBookingGuaranteeSchema,
  insertBookingItemCommissionSchema,
  insertBookingItemTaxLineSchema,
  insertBookingPaymentScheduleSchema,
  insertCreditNoteLineItemSchema,
  insertCreditNoteSchema,
  insertFinanceNoteSchema,
  insertInvoiceExternalRefSchema,
  insertInvoiceLineItemSchema,
  insertInvoiceNumberSeriesSchema,
  insertInvoiceRenditionSchema,
  insertInvoiceSchema,
  insertInvoiceTemplateSchema,
  insertPaymentAuthorizationSchema,
  insertPaymentCaptureSchema,
  insertPaymentInstrumentSchema,
  insertPaymentSchema,
  insertPaymentSessionSchema,
  insertSupplierPaymentSchema,
  insertTaxRegimeSchema,
  invoiceFromBookingSchema,
  invoiceListQuerySchema,
  invoiceNumberSeriesListQuerySchema,
  invoiceTemplateListQuerySchema,
  markPaymentSessionRequiresRedirectSchema,
  paymentAuthorizationListQuerySchema,
  paymentCaptureListQuerySchema,
  paymentInstrumentListQuerySchema,
  paymentSessionListQuerySchema,
  polledInvoiceSettlementProviderResultSchema,
  polledInvoiceSettlementResultSchema,
  pollInvoiceSettlementInputSchema,
  profitabilityQuerySchema,
  renderInvoiceInputSchema,
  revenueReportQuerySchema,
  supplierPaymentListQuerySchema,
  taxRegimeListQuerySchema,
  updateBookingGuaranteeSchema,
  updateBookingItemCommissionSchema,
  updateBookingItemTaxLineSchema,
  updateBookingPaymentScheduleSchema,
  updateCreditNoteLineItemSchema,
  updateCreditNoteSchema,
  updateInvoiceExternalRefSchema,
  updateInvoiceLineItemSchema,
  updateInvoiceNumberSeriesSchema,
  updateInvoiceRenditionSchema,
  updateInvoiceSchema,
  updateInvoiceTemplateSchema,
  updatePaymentAuthorizationSchema,
  updatePaymentCaptureSchema,
  updatePaymentInstrumentSchema,
  updatePaymentSchema,
  updatePaymentSessionSchema,
  updateSupplierPaymentSchema,
  updateTaxRegimeSchema,
} from "./validation.js"
export type {
  PublicBookingFinanceDocuments,
  PublicBookingFinancePayments,
  PublicBookingPaymentOptions,
  PublicFinanceBookingDocument,
  PublicFinanceBookingPayment,
  PublicPaymentOptionsQuery,
  PublicPaymentSession,
  PublicStartPaymentSessionInput,
  PublicValidateVoucherInput,
  PublicVoucherValidationResult,
} from "./validation-public.js"
export {
  publicBookingFinanceDocumentsSchema,
  publicBookingFinancePaymentsSchema,
  publicBookingPaymentOptionsSchema,
  publicFinanceBookingDocumentSchema,
  publicFinanceBookingPaymentSchema,
  publicFinanceDocumentAvailabilitySchema,
  publicFinanceDocumentFormatSchema,
  publicFinanceInvoiceTypeSchema,
  publicPaymentOptionsQuerySchema,
  publicPaymentSessionSchema,
  publicStartPaymentSessionSchema,
  publicValidateVoucherSchema,
  publicVoucherValidationSchema,
} from "./validation-public.js"
