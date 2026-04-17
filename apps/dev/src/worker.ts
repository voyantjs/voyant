import { generateAvailabilitySlots } from "@voyantjs/availability"
import { expireStaleBookingHolds } from "@voyantjs/bookings/tasks"
import { createDbClient } from "@voyantjs/db"
import {
  buildNotificationTaskRuntime,
  createDefaultNotificationProviders,
} from "@voyantjs/notifications"
import { sendDueNotificationReminders } from "@voyantjs/notifications/tasks"
import { generateProductPdf } from "@voyantjs/products/tasks"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { hatchet } from "./hatchet-client.js"

function getDb() {
  return createDbClient(process.env.DATABASE_URL!, { adapter: "node" }) as PostgresJsDatabase
}

const resolveNotificationProviders = (env: Record<string, unknown>) =>
  createDefaultNotificationProviders(env, { emailProvider: "resend" })

const getNotificationTaskRuntime = () =>
  buildNotificationTaskRuntime(process.env, {
    resolveProviders: resolveNotificationProviders,
  })

const generatePdf = hatchet.task({
  name: "products.generate-pdf",
  fn: async (input: { productId: string }) => {
    const result = await generateProductPdf(getDb(), input.productId)
    return {
      base64: Buffer.from(result.pdfBytes).toString("base64"),
      filename: result.filename,
      sizeBytes: result.sizeBytes,
    }
  },
})

const generateSlots = hatchet.task({
  name: "availability.generate-slots",
  fn: async (input: { ruleId?: string; horizonDays?: number }) => {
    return generateAvailabilitySlots(getDb(), {
      ruleId: input.ruleId,
      horizonDays: input.horizonDays,
    })
  },
})

const expireBookingHolds = hatchet.workflow({
  name: "bookings.expire-stale-holds",
  on: {
    cron: "*/5 * * * *",
  },
})

expireBookingHolds.task({
  name: "run",
  fn: async (input: { before?: string | null; note?: string | null }) => {
    return expireStaleBookingHolds(getDb(), input, "system")
  },
})

const sendPaymentReminders = hatchet.workflow({
  name: "notifications.send-due-reminders",
  on: {
    cron: "0 * * * *",
  },
})

sendPaymentReminders.task({
  name: "run",
  fn: async (input: { now?: string | null }) => {
    return sendDueNotificationReminders(getDb(), process.env, input, getNotificationTaskRuntime())
  },
})

async function main() {
  const worker = await hatchet.worker("dev-worker", {
    workflows: [generatePdf, generateSlots, expireBookingHolds, sendPaymentReminders],
  })

  await worker.start()
}

main()
