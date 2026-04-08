import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { extrasRoutes } from "./routes.js"
import { extrasService } from "./service.js"

export type { ExtrasRoutes } from "./routes.js"

export const extrasModule: Module = {
  name: "extras",
}

export const extrasHonoModule: HonoModule = {
  module: extrasModule,
  routes: extrasRoutes,
}

export type {
  BookingExtra,
  NewBookingExtra,
  NewOptionExtraConfig,
  NewProductExtra,
  OptionExtraConfig,
  ProductExtra,
} from "./schema.js"
export {
  bookingExtraStatusEnum,
  bookingExtras,
  extraPricingModeEnum,
  extraSelectionTypeEnum,
  optionExtraConfigs,
  productExtras,
} from "./schema.js"
export {
  bookingExtraListQuerySchema,
  bookingExtraStatusSchema,
  extraPricingModeSchema,
  extraSelectionTypeSchema,
  insertBookingExtraSchema,
  insertOptionExtraConfigSchema,
  insertProductExtraSchema,
  optionExtraConfigListQuerySchema,
  productExtraListQuerySchema,
  updateBookingExtraSchema,
  updateOptionExtraConfigSchema,
  updateProductExtraSchema,
} from "./validation.js"
export { extrasService }
