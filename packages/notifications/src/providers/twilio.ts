import type { NotificationProvider, NotificationResult } from "../types.js"

export type TwilioFetch = (
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

export interface TwilioRenderedSms {
  text: string
}

export interface TwilioProviderOptions {
  accountSid: string
  authToken: string
  from: string
  baseUrl?: string
  fetch?: TwilioFetch
  renderTemplate?: (
    template: string,
    data: unknown,
  ) => Promise<TwilioRenderedSms> | TwilioRenderedSms
}

interface TwilioApiResponse {
  sid?: string
}

function toBase64(value: string) {
  if (typeof btoa === "function") {
    return btoa(value)
  }

  const globals = globalThis as typeof globalThis & {
    Buffer?: {
      from(input: string): {
        toString(encoding: string): string
      }
    }
  }

  if (globals.Buffer) {
    return globals.Buffer.from(value).toString("base64")
  }

  throw new Error("Twilio provider requires a base64 encoder")
}

export function createTwilioProvider(options: TwilioProviderOptions): NotificationProvider {
  const baseUrl = options.baseUrl ?? "https://api.twilio.com/2010-04-01"
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as TwilioFetch | undefined)

  return {
    name: "twilio",
    channels: ["sms"],
    async send(payload): Promise<NotificationResult> {
      if (payload.channel !== "sms") {
        throw new Error(`Twilio provider only supports the "sms" channel, got "${payload.channel}"`)
      }

      if (!fetchImpl) {
        throw new Error("Twilio provider requires a fetch implementation")
      }

      const rendered = options.renderTemplate
        ? await options.renderTemplate(payload.template, payload.data)
        : { text: payload.text ?? JSON.stringify(payload.data ?? {}) }

      const body = new URLSearchParams({
        To: payload.to,
        From: payload.from ?? options.from,
        Body: payload.text ?? rendered.text,
      })

      const response = await fetchImpl(`${baseUrl}/Accounts/${options.accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${toBase64(`${options.accountSid}:${options.authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(`Twilio send failed (${response.status}): ${text}`)
      }

      const data = (await response.json()) as TwilioApiResponse
      return { id: data.sid, provider: "twilio" }
    },
  }
}
