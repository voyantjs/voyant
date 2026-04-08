import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { createNotificationService, notificationsService } from "./service.js"
import type { NotificationProvider } from "./types.js"
import {
  insertNotificationTemplateSchema,
  notificationDeliveryListQuerySchema,
  notificationReminderRuleListQuerySchema,
  notificationReminderRunListQuerySchema,
  notificationTemplateListQuerySchema,
  runDueRemindersSchema,
  sendInvoiceNotificationSchema,
  sendPaymentSessionNotificationSchema,
  sendNotificationSchema,
  insertNotificationReminderRuleSchema,
  updateNotificationTemplateSchema,
  updateNotificationReminderRuleSchema,
} from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export function createNotificationsRoutes(options?: {
  providers?: ReadonlyArray<NotificationProvider>
  resolveProviders?: (bindings: Record<string, unknown>) => ReadonlyArray<NotificationProvider>
}) {
  return new Hono<Env>()
    .get("/templates", async (c) => {
      const query = notificationTemplateListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      return c.json(await notificationsService.listTemplates(c.get("db"), query))
    })
    .post("/templates", async (c) => {
      const row = await notificationsService.createTemplate(
        c.get("db"),
        insertNotificationTemplateSchema.parse(await c.req.json()),
      )
      return c.json({ data: row }, 201)
    })
    .get("/templates/:id", async (c) => {
      const row = await notificationsService.getTemplateById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Notification template not found" }, 404)
      return c.json({ data: row })
    })
    .patch("/templates/:id", async (c) => {
      const row = await notificationsService.updateTemplate(
        c.get("db"),
        c.req.param("id"),
        updateNotificationTemplateSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Notification template not found" }, 404)
      return c.json({ data: row })
    })
    .get("/deliveries", async (c) => {
      const query = notificationDeliveryListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      return c.json(await notificationsService.listDeliveries(c.get("db"), query))
    })
    .get("/deliveries/:id", async (c) => {
      const row = await notificationsService.getDeliveryById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Notification delivery not found" }, 404)
      return c.json({ data: row })
    })
    .get("/reminder-rules", async (c) => {
      const query = notificationReminderRuleListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      return c.json(await notificationsService.listReminderRules(c.get("db"), query))
    })
    .post("/reminder-rules", async (c) => {
      const row = await notificationsService.createReminderRule(
        c.get("db"),
        insertNotificationReminderRuleSchema.parse(await c.req.json()),
      )
      return c.json({ data: row }, 201)
    })
    .get("/reminder-rules/:id", async (c) => {
      const row = await notificationsService.getReminderRuleById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Notification reminder rule not found" }, 404)
      return c.json({ data: row })
    })
    .patch("/reminder-rules/:id", async (c) => {
      const row = await notificationsService.updateReminderRule(
        c.get("db"),
        c.req.param("id"),
        updateNotificationReminderRuleSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Notification reminder rule not found" }, 404)
      return c.json({ data: row })
    })
    .get("/reminder-runs", async (c) => {
      const query = notificationReminderRunListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      return c.json(await notificationsService.listReminderRuns(c.get("db"), query))
    })
    .post("/reminders/run-due", async (c) => {
      try {
        const dispatcher = createNotificationService(
          options?.resolveProviders?.(c.env) ?? options?.providers ?? [],
        )
        const result = await notificationsService.runDueReminders(
          c.get("db"),
          dispatcher,
          runDueRemindersSchema.parse(await c.req.json().catch(() => ({}))),
        )
        return c.json({ data: result })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Reminder sweep failed"
        return c.json({ error: message }, 400)
      }
    })
    .post("/payment-sessions/:id/send", async (c) => {
      try {
        const dispatcher = createNotificationService(
          options?.resolveProviders?.(c.env) ?? options?.providers ?? [],
        )
        const row = await notificationsService.sendPaymentSessionNotification(
          c.get("db"),
          dispatcher,
          c.req.param("id"),
          sendPaymentSessionNotificationSchema.parse(await c.req.json()),
        )
        if (!row) return c.json({ error: "Payment session not found" }, 404)
        return c.json({ data: row }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payment session notification failed"
        return c.json({ error: message }, 400)
      }
    })
    .post("/invoices/:id/send", async (c) => {
      try {
        const dispatcher = createNotificationService(
          options?.resolveProviders?.(c.env) ?? options?.providers ?? [],
        )
        const row = await notificationsService.sendInvoiceNotification(
          c.get("db"),
          dispatcher,
          c.req.param("id"),
          sendInvoiceNotificationSchema.parse(await c.req.json()),
        )
        if (!row) return c.json({ error: "Invoice not found" }, 404)
        return c.json({ data: row }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invoice notification failed"
        return c.json({ error: message }, 400)
      }
    })
    .post("/send", async (c) => {
      try {
        const dispatcher = createNotificationService(
          options?.resolveProviders?.(c.env) ?? options?.providers ?? [],
        )
        const row = await notificationsService.sendNotification(
          c.get("db"),
          dispatcher,
          sendNotificationSchema.parse(await c.req.json()),
        )
        return c.json({ data: row }, 201)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Notification send failed"
        return c.json({ error: message }, 400)
      }
    })
}
