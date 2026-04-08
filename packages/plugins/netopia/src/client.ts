import type {
  NetopiaFetch,
  NetopiaRuntimeOptions,
  NetopiaStartPaymentRequest,
  NetopiaStartPaymentResponse,
  ResolvedNetopiaRuntimeOptions,
} from "./types.js"

export interface NetopiaClientApi {
  startCardPayment(request: NetopiaStartPaymentRequest): Promise<NetopiaStartPaymentResponse>
}

export interface NetopiaClientOptions extends Pick<ResolvedNetopiaRuntimeOptions, "apiUrl" | "apiKey"> {
  fetch?: NetopiaFetch
}

export function resolveNetopiaRuntimeOptions(
  bindings: Record<string, unknown> | undefined,
  options: NetopiaRuntimeOptions = {},
): ResolvedNetopiaRuntimeOptions {
  const env = bindings ?? {}
  const apiUrl = options.apiUrl ?? coerceString(env.NETOPIA_URL)
  const apiKey = options.apiKey ?? coerceString(env.NETOPIA_API_KEY)
  const posSignature = options.posSignature ?? coerceString(env.NETOPIA_POS_SIGNATURE)
  const notifyUrl = options.notifyUrl ?? coerceString(env.NETOPIA_NOTIFY_URL)
  const redirectUrl = options.redirectUrl ?? coerceString(env.NETOPIA_REDIRECT_URL)

  if (!apiUrl) throw new Error("Missing Netopia config: NETOPIA_URL")
  if (!apiKey) throw new Error("Missing Netopia config: NETOPIA_API_KEY")
  if (!posSignature) throw new Error("Missing Netopia config: NETOPIA_POS_SIGNATURE")
  if (!notifyUrl) throw new Error("Missing Netopia config: NETOPIA_NOTIFY_URL")
  if (!redirectUrl) throw new Error("Missing Netopia config: NETOPIA_REDIRECT_URL")

  return {
    apiUrl,
    apiKey,
    posSignature,
    notifyUrl,
    redirectUrl,
    emailTemplate: options.emailTemplate ?? "confirm",
    language: options.language ?? "ro",
    successStatuses: options.successStatuses ?? [3, 5],
    processingStatuses: options.processingStatuses ?? [1, 15],
    fetch: options.fetch,
  }
}

function coerceString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export function createNetopiaClient(options: NetopiaClientOptions): NetopiaClientApi {
  const apiUrl = options.apiUrl.replace(/\/$/, "")
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as NetopiaFetch | undefined)

  async function request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
    if (!fetchImpl) {
      throw new Error("Netopia client requires a fetch implementation")
    }

    const response = await fetchImpl(`${apiUrl}${path}`, {
      method,
      headers: {
        Authorization: options.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    let text = ""
    let json: unknown = null
    try {
      text = await response.text()
      json = text ? JSON.parse(text) : null
    } catch {
      // Surface raw text in the thrown error below.
    }

    return { ok: response.ok, status: response.status, json, text }
  }

  return {
    async startCardPayment(requestBody: NetopiaStartPaymentRequest) {
      const res = await request("POST", "/payment/card/start", requestBody)
      const json = (res.json ?? {}) as NetopiaStartPaymentResponse
      if (!res.ok || json.error) {
        throw new Error(
          `Netopia start payment failed (${json.error?.code ?? res.status}): ${json.error?.message ?? res.text}`,
        )
      }
      return json
    },
  }
}
