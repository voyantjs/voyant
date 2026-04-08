import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const productsRef = pgTable("products", {
  id: typeId("products").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sellCurrency: text("sell_currency").notNull(),
  sellAmountCents: integer("sell_amount_cents"),
  costAmountCents: integer("cost_amount_cents"),
  marginPercent: integer("margin_percent"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  pax: integer("pax"),
})

export const productOptionsRef = pgTable("product_options", {
  id: typeId("product_options").primaryKey(),
  productId: typeIdRef("product_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const optionUnitsRef = pgTable("option_units", {
  id: typeId("option_units").primaryKey(),
  optionId: typeIdRef("option_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  unitType: text("unit_type"),
  isRequired: boolean("is_required").notNull().default(false),
  minQuantity: integer("min_quantity"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productDaysRef = pgTable("product_days", {
  id: typeId("product_days").primaryKey(),
  productId: typeIdRef("product_id").notNull(),
  dayNumber: integer("day_number").notNull(),
})

export const productDayServicesRef = pgTable("product_day_services", {
  id: typeId("product_day_services").primaryKey(),
  dayId: typeIdRef("day_id").notNull(),
  supplierServiceId: text("supplier_service_id"),
  serviceType: text("service_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  costCurrency: text("cost_currency").notNull(),
  costAmountCents: integer("cost_amount_cents").notNull(),
  quantity: integer("quantity").notNull().default(1),
  sortOrder: integer("sort_order"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productTicketSettingsRef = pgTable("product_ticket_settings", {
  id: typeId("product_ticket_settings").primaryKey(),
  productId: typeIdRef("product_id").notNull(),
  fulfillmentMode: text("fulfillment_mode").notNull(),
  defaultDeliveryFormat: text("default_delivery_format").notNull(),
  ticketPerUnit: boolean("ticket_per_unit").notNull().default(false),
})

export const bookingProductDetailsRef = pgTable("booking_product_details", {
  bookingId: text("booking_id").primaryKey(),
  productId: text("product_id"),
  optionId: text("option_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const bookingItemProductDetailsRef = pgTable("booking_item_product_details", {
  bookingItemId: text("booking_item_id").primaryKey(),
  productId: text("product_id"),
  optionId: text("option_id"),
  unitId: text("unit_id"),
  supplierServiceId: text("supplier_service_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
