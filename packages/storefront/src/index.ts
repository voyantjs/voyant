import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { createStorefrontPublicRoutes } from "./routes-public.js"

export type { StorefrontPublicRoutes } from "./routes-public.js"
export { createStorefrontPublicRoutes } from "./routes-public.js"
export type { StorefrontServiceOptions } from "./service.js"
export { createStorefrontService, resolveStorefrontSettings } from "./service.js"
export type {
  StorefrontFormField,
  StorefrontFormFieldInput,
  StorefrontPaymentMethod,
  StorefrontPaymentMethodCode,
  StorefrontPaymentMethodInput,
  StorefrontSettings,
  StorefrontSettingsInput,
} from "./validation.js"
export {
  storefrontFormFieldInputSchema,
  storefrontFormFieldOptionSchema,
  storefrontFormFieldSchema,
  storefrontFormFieldTypeSchema,
  storefrontPaymentMethodCodeSchema,
  storefrontPaymentMethodInputSchema,
  storefrontPaymentMethodSchema,
  storefrontSettingsInputSchema,
  storefrontSettingsSchema,
} from "./validation.js"

export const storefrontModule: Module = {
  name: "storefront",
}

export function createStorefrontHonoModule(
  options?: Parameters<typeof createStorefrontPublicRoutes>[0],
): HonoModule {
  return {
    module: storefrontModule,
    publicRoutes: createStorefrontPublicRoutes(options),
  }
}
