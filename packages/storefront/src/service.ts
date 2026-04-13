import {
  type StorefrontFormField,
  type StorefrontFormFieldInput,
  type StorefrontPaymentMethod,
  type StorefrontPaymentMethodCode,
  type StorefrontPaymentMethodInput,
  type StorefrontSettings,
  type StorefrontSettingsInput,
  storefrontSettingsInputSchema,
  storefrontSettingsSchema,
} from "./validation.js"

export interface StorefrontServiceOptions {
  settings?: StorefrontSettingsInput
}

const defaultPaymentLabels: Record<StorefrontPaymentMethodCode, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  voucher: "Voucher",
  invoice: "Invoice",
}

function normalizeField(field: StorefrontFormFieldInput): StorefrontFormField {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? null,
    description: field.description ?? null,
    autocomplete: field.autocomplete ?? null,
    options: field.options,
  }
}

function normalizePaymentMethod(method: StorefrontPaymentMethodInput): StorefrontPaymentMethod {
  return {
    code: method.code,
    label: method.label ?? defaultPaymentLabels[method.code],
    description: method.description ?? null,
    enabled: method.enabled,
  }
}

export function resolveStorefrontSettings(input?: StorefrontSettingsInput): StorefrontSettings {
  const parsed = storefrontSettingsInputSchema.parse(input ?? {})

  return storefrontSettingsSchema.parse({
    branding: {
      logoUrl: parsed.branding?.logoUrl ?? null,
      supportedLanguages: parsed.branding?.supportedLanguages ?? [],
    },
    support: {
      email: parsed.support?.email ?? null,
      phone: parsed.support?.phone ?? null,
    },
    legal: {
      termsUrl: parsed.legal?.termsUrl ?? null,
      privacyUrl: parsed.legal?.privacyUrl ?? null,
      defaultContractTemplateId: parsed.legal?.defaultContractTemplateId ?? null,
    },
    forms: {
      billing: {
        fields: (parsed.forms?.billing?.fields ?? []).map(normalizeField),
      },
      passengers: {
        fields: (parsed.forms?.passengers?.fields ?? []).map(normalizeField),
      },
    },
    payment: {
      defaultMethod: parsed.payment?.defaultMethod ?? null,
      methods: (parsed.payment?.methods ?? []).map(normalizePaymentMethod),
    },
  })
}

export function createStorefrontService(options?: StorefrontServiceOptions) {
  const settings = resolveStorefrontSettings(options?.settings)

  return {
    getSettings(): StorefrontSettings {
      return settings
    },
  }
}
