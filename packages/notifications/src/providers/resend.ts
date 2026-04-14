import type { NotificationProvider, NotificationResult } from "../types.js"

/**
 * Minimal `fetch` shape the Resend provider depends on. Works with the
 * global `fetch` in Node 18+ / workers / browsers, and can be stubbed in
 * tests.
 */
export type ResendFetch = (
  input: string,
  init: {
    method: string
    headers: Record<string, string>
    body: string
  },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
  text: () => Promise<string>
}>

/**
 * Rendered email template. At least one of `html` or `text` should be set.
 */
export interface ResendRenderedEmail {
  subject: string
  html?: string
  text?: string
}

/**
 * Options for {@link createResendProvider}.
 */
export interface ResendProviderOptions {
  /** Resend API key. */
  apiKey: string
  /** Default sender address. Payload `from` overrides. */
  from: string
  /** Override the Resend API base URL. Defaults to `https://api.resend.com`. */
  baseUrl?: string
  /** Override `fetch` (e.g. in tests). Defaults to global `fetch`. */
  fetch?: ResendFetch
  /**
   * Render a template id + data tuple into an email body. When omitted,
   * the payload's `template` is used as the subject and `data` is
   * JSON-stringified into the text body.
   */
  renderTemplate?: (
    template: string,
    data: unknown,
  ) => Promise<ResendRenderedEmail> | ResendRenderedEmail
}

interface ResendApiResponse {
  id?: string
}

/**
 * Create a notification provider that delivers email through the Resend HTTP
 * API (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Only the `"email"` channel is supported; attempting to send to any other
 * channel throws.
 */
export function createResendProvider(options: ResendProviderOptions): NotificationProvider {
  const baseUrl = options.baseUrl ?? "https://api.resend.com"
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as ResendFetch | undefined)

  return {
    name: "resend",
    channels: ["email"],
    async send(payload): Promise<NotificationResult> {
      if (payload.channel !== "email") {
        throw new Error(
          `Resend provider only supports the "email" channel, got "${payload.channel}"`,
        )
      }
      if (!fetchImpl) {
        throw new Error("Resend provider requires a fetch implementation")
      }
      const rendered = options.renderTemplate
        ? await options.renderTemplate(payload.template, payload.data)
        : {
            subject: payload.subject ?? payload.template,
            text: JSON.stringify(payload.data ?? {}),
          }
      const body = {
        from: payload.from ?? options.from,
        to: payload.to,
        subject: payload.subject ?? rendered.subject,
        html: payload.html ?? rendered.html,
        text: payload.text ?? rendered.text,
        attachments: payload.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.contentBase64,
          path: attachment.path,
          content_type: attachment.contentType,
          disposition: attachment.disposition,
          content_id: attachment.contentId,
        })),
      }
      const response = await fetchImpl(`${baseUrl}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(`Resend send failed (${response.status}): ${text}`)
      }
      const data = (await response.json()) as ResendApiResponse
      return { id: data.id, provider: "resend" }
    },
  }
}
