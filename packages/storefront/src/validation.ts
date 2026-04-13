import { z } from "zod"

const languageTagSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
const urlOrNullSchema = z.url().nullable()

export const storefrontPaymentMethodCodeSchema = z.enum([
  "card",
  "bank_transfer",
  "cash",
  "voucher",
  "invoice",
])

export const storefrontFormFieldTypeSchema = z.enum([
  "text",
  "email",
  "tel",
  "textarea",
  "select",
  "checkbox",
  "date",
  "country",
])

export const storefrontFormFieldOptionSchema = z.object({
  value: z.string().trim().min(1),
  label: z.string().trim().min(1),
})

export const storefrontFormFieldInputSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  type: storefrontFormFieldTypeSchema.default("text"),
  required: z.boolean().default(false),
  placeholder: z.string().trim().min(1).optional().nullable(),
  description: z.string().trim().min(1).optional().nullable(),
  autocomplete: z.string().trim().min(1).optional().nullable(),
  options: z.array(storefrontFormFieldOptionSchema).default([]),
})

export const storefrontFormFieldSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  type: storefrontFormFieldTypeSchema,
  required: z.boolean(),
  placeholder: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  autocomplete: z.string().trim().min(1).nullable(),
  options: z.array(storefrontFormFieldOptionSchema),
})

export const storefrontPaymentMethodInputSchema = z.object({
  code: storefrontPaymentMethodCodeSchema,
  label: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional().nullable(),
  enabled: z.boolean().default(true),
})

export const storefrontPaymentMethodSchema = z.object({
  code: storefrontPaymentMethodCodeSchema,
  label: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable(),
  enabled: z.boolean(),
})

export const storefrontSettingsInputSchema = z.object({
  branding: z
    .object({
      logoUrl: z.url().optional().nullable(),
      supportedLanguages: z.array(languageTagSchema).optional(),
    })
    .optional(),
  support: z
    .object({
      email: z.email().optional().nullable(),
      phone: z.string().trim().min(1).optional().nullable(),
    })
    .optional(),
  legal: z
    .object({
      termsUrl: z.url().optional().nullable(),
      privacyUrl: z.url().optional().nullable(),
      defaultContractTemplateId: z.string().trim().min(1).optional().nullable(),
    })
    .optional(),
  forms: z
    .object({
      billing: z
        .object({
          fields: z.array(storefrontFormFieldInputSchema).default([]),
        })
        .optional(),
      passengers: z
        .object({
          fields: z.array(storefrontFormFieldInputSchema).default([]),
        })
        .optional(),
    })
    .optional(),
  payment: z
    .object({
      defaultMethod: storefrontPaymentMethodCodeSchema.optional().nullable(),
      methods: z.array(storefrontPaymentMethodInputSchema).optional(),
    })
    .optional(),
})

export const storefrontSettingsSchema = z.object({
  branding: z.object({
    logoUrl: urlOrNullSchema,
    supportedLanguages: z.array(languageTagSchema),
  }),
  support: z.object({
    email: z.email().nullable(),
    phone: z.string().trim().min(1).nullable(),
  }),
  legal: z.object({
    termsUrl: urlOrNullSchema,
    privacyUrl: urlOrNullSchema,
    defaultContractTemplateId: z.string().trim().min(1).nullable(),
  }),
  forms: z.object({
    billing: z.object({
      fields: z.array(storefrontFormFieldSchema),
    }),
    passengers: z.object({
      fields: z.array(storefrontFormFieldSchema),
    }),
  }),
  payment: z.object({
    defaultMethod: storefrontPaymentMethodCodeSchema.nullable(),
    methods: z.array(storefrontPaymentMethodSchema),
  }),
})

export type StorefrontFormFieldInput = z.infer<typeof storefrontFormFieldInputSchema>
export type StorefrontFormField = z.infer<typeof storefrontFormFieldSchema>
export type StorefrontPaymentMethodInput = z.infer<typeof storefrontPaymentMethodInputSchema>
export type StorefrontPaymentMethod = z.infer<typeof storefrontPaymentMethodSchema>
export type StorefrontPaymentMethodCode = z.infer<typeof storefrontPaymentMethodCodeSchema>
export type StorefrontSettingsInput = z.infer<typeof storefrontSettingsInputSchema>
export type StorefrontSettings = z.infer<typeof storefrontSettingsSchema>
