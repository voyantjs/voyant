import { Hono } from "hono"
import {
  authorizeTransactionPiiAccess,
  createPiiService,
  type Env,
  hasParticipantIdentityInput,
  logTransactionPiiAccess,
  notFound,
} from "./routes-shared.js"
import { transactionsService } from "./service.js"
import {
  insertOrderItemParticipantSchema,
  insertOrderItemSchema,
  insertOrderParticipantSchema,
  insertOrderSchema,
  insertOrderTermSchema,
  orderItemListQuerySchema,
  orderItemParticipantListQuerySchema,
  orderListQuerySchema,
  orderParticipantListQuerySchema,
  orderTermListQuerySchema,
  updateOrderItemParticipantSchema,
  updateOrderItemSchema,
  updateOrderParticipantSchema,
  updateOrderSchema,
  updateOrderTermSchema,
} from "./validation.js"

export const transactionOrderRoutes = new Hono<Env>()
  .get("/orders", async (c) => {
    const query = orderListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await transactionsService.listOrders(c.get("db"), query))
  })
  .post("/orders", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrder(
          c.get("db"),
          insertOrderSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/orders/:id", async (c) => {
    const row = await transactionsService.getOrderById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Order not found")
  })
  .patch("/orders/:id", async (c) => {
    const row = await transactionsService.updateOrder(
      c.get("db"),
      c.req.param("id"),
      updateOrderSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order not found")
  })
  .delete("/orders/:id", async (c) => {
    const row = await transactionsService.deleteOrder(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order not found")
  })
  .get("/order-participants", async (c) => {
    const query = orderParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderParticipants(c.get("db"), query))
  })
  .post("/order-participants", async (c) => {
    const payload = insertOrderParticipantSchema.parse(await c.req.json())
    const row = await transactionsService.createOrderParticipant(c.get("db"), payload)
    if (!row) return c.json({ data: row }, 201)
    if (hasParticipantIdentityInput(payload)) {
      const pii = createPiiService(c, "order", row.orderId)
      await pii.upsertParticipantIdentity(c.get("db"), "order", row.id, payload, c.get("userId"))
      return c.json(
        { data: await transactionsService.getOrderParticipantById(c.get("db"), row.id) },
        201,
      )
    }
    return c.json({ data: row }, 201)
  })
  .get("/order-participants/:id", async (c) => {
    const row = await transactionsService.getOrderParticipantById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Order participant not found")
  })
  .patch("/order-participants/:id", async (c) => {
    const payload = updateOrderParticipantSchema.parse(await c.req.json())
    const row = await transactionsService.updateOrderParticipant(
      c.get("db"),
      c.req.param("id"),
      payload,
    )
    if (!row) return notFound(c, "Order participant not found")
    if (hasParticipantIdentityInput(payload)) {
      const pii = createPiiService(c, "order", row.orderId)
      await pii.upsertParticipantIdentity(c.get("db"), "order", row.id, payload, c.get("userId"))
      return c.json({
        data: await transactionsService.getOrderParticipantById(c.get("db"), row.id),
      })
    }
    return c.json({ data: row })
  })
  .get("/order-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOrderParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!participant) return notFound(c, "Order participant not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "order",
      participantId: participant.id,
      parentId: participant.orderId,
      action: "read",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "order", participant.orderId)
    const row = await pii.getParticipantIdentity(
      c.get("db"),
      "order",
      participant.id,
      c.get("userId"),
    )
    if (!row) {
      await logTransactionPiiAccess(c, {
        participantKind: "order",
        parentId: participant.orderId,
        participantId: participant.id,
        action: "read",
        outcome: "denied",
        reason: "travel_details_not_found",
      })
      return c.json({ error: "Order participant travel details not found" }, 404)
    }
    return c.json({ data: row })
  })
  .patch("/order-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOrderParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!participant) return notFound(c, "Order participant not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "order",
      participantId: participant.id,
      parentId: participant.orderId,
      action: "update",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "order", participant.orderId)
    const row = await pii.upsertParticipantIdentity(
      c.get("db"),
      "order",
      participant.id,
      updateOrderParticipantSchema.parse(await c.req.json()),
      c.get("userId"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order participant not found")
  })
  .delete("/order-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOrderParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!participant) return notFound(c, "Order participant not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "order",
      participantId: participant.id,
      parentId: participant.orderId,
      action: "delete",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "order", participant.orderId)
    const row = await pii.deleteParticipantIdentity(
      c.get("db"),
      "order",
      participant.id,
      c.get("userId"),
    )
    return row
      ? c.json({ success: true })
      : c.json({ error: "Order participant travel details not found" }, 404)
  })
  .delete("/order-participants/:id", async (c) => {
    const row = await transactionsService.deleteOrderParticipant(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order participant not found")
  })
  .get("/order-items", async (c) => {
    const query = orderItemListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderItems(c.get("db"), query))
  })
  .post("/order-items", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrderItem(
          c.get("db"),
          insertOrderItemSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/order-items/:id", async (c) => {
    const row = await transactionsService.getOrderItemById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Order item not found")
  })
  .patch("/order-items/:id", async (c) => {
    const row = await transactionsService.updateOrderItem(
      c.get("db"),
      c.req.param("id"),
      updateOrderItemSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order item not found")
  })
  .delete("/order-items/:id", async (c) => {
    const row = await transactionsService.deleteOrderItem(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order item not found")
  })
  .get("/order-item-participants", async (c) => {
    const query = orderItemParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderItemParticipants(c.get("db"), query))
  })
  .post("/order-item-participants", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrderItemParticipant(
          c.get("db"),
          insertOrderItemParticipantSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/order-item-participants/:id", async (c) => {
    const row = await transactionsService.getOrderItemParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order item participant not found")
  })
  .patch("/order-item-participants/:id", async (c) => {
    const row = await transactionsService.updateOrderItemParticipant(
      c.get("db"),
      c.req.param("id"),
      updateOrderItemParticipantSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order item participant not found")
  })
  .delete("/order-item-participants/:id", async (c) => {
    const row = await transactionsService.deleteOrderItemParticipant(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order item participant not found")
  })
  .get("/order-terms", async (c) => {
    const query = orderTermListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderTerms(c.get("db"), query))
  })
  .post("/order-terms", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrderTerm(
          c.get("db"),
          insertOrderTermSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/order-terms/:id", async (c) => {
    const row = await transactionsService.getOrderTermById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Order term not found")
  })
  .patch("/order-terms/:id", async (c) => {
    const row = await transactionsService.updateOrderTerm(
      c.get("db"),
      c.req.param("id"),
      updateOrderTermSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order term not found")
  })
  .delete("/order-terms/:id", async (c) => {
    const row = await transactionsService.deleteOrderTerm(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order term not found")
  })
