import type {
  SmartbillFetch,
  SmartbillInvoiceBody,
  SmartbillInvoiceResponse,
  SmartbillPdfResponse,
  SmartbillStatusResponse,
} from "./types.js"

/**
 * Options for {@link createSmartbillClient}.
 */
export interface SmartbillClientOptions {
  /** SmartBill account username (email). */
  username: string
  /** SmartBill API token. */
  apiToken: string
  /**
   * SmartBill API base URL. Defaults to `"https://ws.smartbill.ro/SBORO/api"`.
   */
  apiUrl?: string
  /** Override `fetch` (e.g. in tests). Defaults to global `fetch`. */
  fetch?: SmartbillFetch
}

export interface SmartbillClientApi {
  /** Create an invoice. Returns the series + number + URL. */
  createInvoice(body: SmartbillInvoiceBody): Promise<SmartbillInvoiceResponse>
  /** Create a proforma invoice. */
  createProforma(body: SmartbillInvoiceBody): Promise<SmartbillInvoiceResponse>
  /** Cancel an invoice by series + number. */
  cancelInvoice(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<{ errorText?: string }>
  /** Delete an invoice by series + number. */
  deleteInvoice(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<{ errorText?: string }>
  /** Reverse an invoice by series + number. */
  reverseInvoice(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<SmartbillInvoiceResponse>
  /** Get PDF URL for an invoice. */
  viewPdf(companyVatCode: string, seriesName: string, number: string): Promise<SmartbillPdfResponse>
  /** Get payment status for an invoice. */
  getPaymentStatus(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<SmartbillStatusResponse>
}

export function createSmartbillClient(options: SmartbillClientOptions): SmartbillClientApi {
  const apiUrl = (options.apiUrl ?? "https://ws.smartbill.ro/SBORO/api").replace(/\/$/, "")
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as SmartbillFetch | undefined)

  function authHeader(): string {
    return `Basic ${btoa(`${options.username}:${options.apiToken}`)}`
  }

  function headers(): Record<string, string> {
    return {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    }
  }

  async function request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
    if (!fetchImpl) {
      throw new Error("SmartBill client requires a fetch implementation")
    }
    const init: { method: string; headers: Record<string, string>; body?: string } = {
      method,
      headers: headers(),
    }
    if (body !== undefined) init.body = JSON.stringify(body)
    const response = await fetchImpl(`${apiUrl}${path}`, init)
    let text = ""
    let json: unknown = null
    try {
      text = await response.text()
      json = text ? JSON.parse(text) : null
    } catch {
      // leave json as null, surface text
    }
    return { ok: response.ok, status: response.status, json, text }
  }

  async function createInvoice(body: SmartbillInvoiceBody): Promise<SmartbillInvoiceResponse> {
    const res = await request("POST", "/invoice", body)
    if (!res.ok) {
      throw new Error(`SmartBill createInvoice failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as SmartbillInvoiceResponse
  }

  async function createProforma(body: SmartbillInvoiceBody): Promise<SmartbillInvoiceResponse> {
    const res = await request("POST", "/estimate", body)
    if (!res.ok) {
      throw new Error(`SmartBill createProforma failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as SmartbillInvoiceResponse
  }

  async function cancelInvoice(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<{ errorText?: string }> {
    const res = await request("PUT", "/invoice/cancel", {
      companyVatCode,
      seriesName,
      number,
    })
    if (!res.ok) {
      throw new Error(`SmartBill cancelInvoice failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as { errorText?: string }
  }

  async function deleteInvoice(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<{ errorText?: string }> {
    const query = `cif=${encodeURIComponent(companyVatCode)}&seriesname=${encodeURIComponent(seriesName)}&number=${encodeURIComponent(number)}`
    const res = await request("DELETE", `/invoice?${query}`)
    if (!res.ok) {
      throw new Error(`SmartBill deleteInvoice failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as { errorText?: string }
  }

  async function reverseInvoice(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<SmartbillInvoiceResponse> {
    const res = await request("PUT", "/invoice/reverse", {
      companyVatCode,
      seriesName,
      number,
    })
    if (!res.ok) {
      throw new Error(`SmartBill reverseInvoice failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as SmartbillInvoiceResponse
  }

  async function viewPdf(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<SmartbillPdfResponse> {
    const query = `cif=${encodeURIComponent(companyVatCode)}&seriesname=${encodeURIComponent(seriesName)}&number=${encodeURIComponent(number)}`
    const res = await request("GET", `/invoice/pdf?${query}`)
    if (!res.ok) {
      throw new Error(`SmartBill viewPdf failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as SmartbillPdfResponse
  }

  async function getPaymentStatus(
    companyVatCode: string,
    seriesName: string,
    number: string,
  ): Promise<SmartbillStatusResponse> {
    const query = `cif=${encodeURIComponent(companyVatCode)}&seriesname=${encodeURIComponent(seriesName)}&number=${encodeURIComponent(number)}`
    const res = await request("GET", `/invoice/paymentstatus?${query}`)
    if (!res.ok) {
      throw new Error(`SmartBill getPaymentStatus failed (${res.status}): ${res.text}`)
    }
    return (res.json ?? {}) as SmartbillStatusResponse
  }

  return {
    createInvoice,
    createProforma,
    cancelInvoice,
    deleteInvoice,
    reverseInvoice,
    viewPdf,
    getPaymentStatus,
  }
}
