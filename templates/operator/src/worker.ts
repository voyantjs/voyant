import { expireStaleBookingHolds } from "@voyantjs/bookings/tasks"
import { createDbClient } from "@voyantjs/db"
import { sendDueNotificationReminders } from "@voyantjs/notifications/tasks"
import { generateProductPdf } from "@voyantjs/products/tasks"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { hatchet } from "./hatchet-client.js"
import { getNotificationTaskRuntime } from "./lib/notifications.js"

function getDb() {
  return createDbClient(process.env.DATABASE_URL!, { adapter: "node" }) as PostgresJsDatabase
}

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
    return sendDueNotificationReminders(
      getDb(),
      process.env,
      input,
      getNotificationTaskRuntime(process.env),
    )
  },
})

async function main() {
  const worker = await hatchet.worker("operator-worker", {
    workflows: [generatePdf, expireBookingHolds, sendPaymentReminders],
  })

  await worker.start()
}

main()
