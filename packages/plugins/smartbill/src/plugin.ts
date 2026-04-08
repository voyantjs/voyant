import type { Plugin, Subscriber } from "@voyantjs/core"

import { createSmartbillClient, type SmartbillClientOptions } from "./client.js"
import { mapVoyantInvoiceToSmartbill, type SmartbillMappingOptions } from "./mapping.js"
import type { VoyantInvoiceEvent } from "./types.js"

/**
 * Event names the plugin subscribes to. Defaults match the
 * `invoice.<action>` naming convention from the EventBus.
 */
export interface SmartbillSyncEventNames {
  issued?: string
  voided?: string
  syncRequested?: string
}

/**
 * Logger shape used to surface plugin errors without coupling to any specific
 * runtime. Defaults to `console`.
 */
export interface SmartbillLogger {
  error: (message: string, meta?: unknown) => void
  info?: (message: string, meta?: unknown) => void
}

/**
 * Custom mapper from a Voyant invoice event to a SmartBill invoice body.
 * When provided, replaces the default {@link mapVoyantInvoiceToSmartbill}.
 */
export type SmartbillMapFn = (
  event: VoyantInvoiceEvent,
) => ReturnType<typeof mapVoyantInvoiceToSmartbill>

export interface SmartbillPluginOptions extends SmartbillClientOptions, SmartbillMappingOptions {
  /**
   * Event names this plugin subscribes to.
   * Defaults to `invoice.issued` / `invoice.voided` / `invoice.external.sync.requested`.
   */
  events?: SmartbillSyncEventNames
  /**
   * Map a Voyant invoice event into a SmartBill invoice body.
   * Defaults to the built-in {@link mapVoyantInvoiceToSmartbill}.
   */
  mapEvent?: SmartbillMapFn
  /** Override logger. Defaults to `console`. */
  logger?: SmartbillLogger
}

function coerceEvent(data: unknown): VoyantInvoiceEvent | null {
  if (data == null || typeof data !== "object") return null
  const maybe = data as Record<string, unknown>
  if (typeof maybe.id !== "string") return null
  return maybe as VoyantInvoiceEvent
}

/**
 * Build a Voyant {@link Plugin} that pushes invoice events to SmartBill
 * for Romanian e-invoicing.
 *
 * The plugin subscribes to three events (configurable via
 * {@link SmartbillPluginOptions.events}):
 * - `invoice.issued` → create invoice in SmartBill
 * - `invoice.voided` → cancel invoice in SmartBill
 * - `invoice.external.sync.requested` → re-fetch payment status
 *
 * Errors are caught and logged — subscribers are fire-and-forget per the
 * EventBus contract, so a SmartBill outage never blocks the emitter.
 */
export function smartbillPlugin(options: SmartbillPluginOptions): Plugin {
  const client = createSmartbillClient(options)
  const logger = options.logger ?? console
  const mappingOptions: SmartbillMappingOptions = {
    companyVatCode: options.companyVatCode,
    seriesName: options.seriesName,
    language: options.language,
    isTaxIncluded: options.isTaxIncluded,
    art311SpecialRegime: options.art311SpecialRegime,
  }
  const mapEvent =
    options.mapEvent ??
    ((ev: VoyantInvoiceEvent) => mapVoyantInvoiceToSmartbill(ev, mappingOptions))
  const eventNames = {
    issued: options.events?.issued ?? "invoice.issued",
    voided: options.events?.voided ?? "invoice.voided",
    syncRequested: options.events?.syncRequested ?? "invoice.external.sync.requested",
  }

  const subscribers: Subscriber[] = [
    {
      event: eventNames.issued,
      handler: async (data) => {
        const event = coerceEvent(data)
        if (!event) return
        try {
          const body = mapEvent(event)
          const result = await client.createInvoice(body)
          logger.info?.(
            `[smartbill] invoice created: ${result.series}-${result.number} for ${event.id}`,
            result,
          )
        } catch (err) {
          logger.error(
            `[smartbill] createInvoice on "${eventNames.issued}" failed for ${event.id}`,
            err,
          )
        }
      },
    },
    {
      event: eventNames.voided,
      handler: async (data) => {
        const event = coerceEvent(data)
        if (!event) return
        try {
          const seriesName =
            typeof event.externalSeriesName === "string"
              ? event.externalSeriesName
              : options.seriesName
          const number =
            typeof event.externalNumber === "string"
              ? event.externalNumber
              : typeof event.invoiceNumber === "string"
                ? event.invoiceNumber
                : undefined
          if (!number) {
            logger.error(`[smartbill] cannot cancel invoice ${event.id}: missing external number`)
            return
          }
          await client.cancelInvoice(options.companyVatCode, seriesName, number)
          logger.info?.(`[smartbill] invoice cancelled: ${seriesName}-${number} for ${event.id}`)
        } catch (err) {
          logger.error(
            `[smartbill] cancelInvoice on "${eventNames.voided}" failed for ${event.id}`,
            err,
          )
        }
      },
    },
    {
      event: eventNames.syncRequested,
      handler: async (data) => {
        const event = coerceEvent(data)
        if (!event) return
        try {
          const seriesName =
            typeof event.externalSeriesName === "string"
              ? event.externalSeriesName
              : options.seriesName
          const number =
            typeof event.externalNumber === "string"
              ? event.externalNumber
              : typeof event.invoiceNumber === "string"
                ? event.invoiceNumber
                : undefined
          if (!number) {
            logger.error(`[smartbill] cannot sync invoice ${event.id}: missing external number`)
            return
          }
          const status = await client.getPaymentStatus(options.companyVatCode, seriesName, number)
          logger.info?.(
            `[smartbill] payment status for ${seriesName}-${number}: ${status.status}`,
            status,
          )
        } catch (err) {
          logger.error(
            `[smartbill] getPaymentStatus on "${eventNames.syncRequested}" failed for ${event.id}`,
            err,
          )
        }
      },
    },
  ]

  return {
    name: "smartbill",
    version: "0.1.0",
    subscribers,
  }
}
