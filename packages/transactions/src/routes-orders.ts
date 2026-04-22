import { normalizeValidationError, parseJsonBody, parseQuery } from "@voyantjs/hono"
import { Hono } from "hono"
import {
  authorizeTransactionPiiAccess,
  createPiiService,
  type Env,
  hasTravelerIdentityInput,
  logTransactionPiiAccess,
  notFound,
} from "./routes-shared.js"
import { transactionsService } from "./service.js"
import { toTravelerIdentityResponse } from "./service-shared.js"
import {
  insertOrderContactAssignmentSchema,
  insertOrderItemSchema,
  insertOrderItemTravelerSchema,
  insertOrderSchema,
  insertOrderStaffAssignmentSchema,
  insertOrderTermSchema,
  insertOrderTravelerSchema,
  orderContactAssignmentListQuerySchema,
  orderItemListQuerySchema,
  orderItemTravelerListQuerySchema,
  orderListQuerySchema,
  orderStaffAssignmentListQuerySchema,
  orderTermListQuerySchema,
  orderTravelerListQuerySchema,
  updateOrderContactAssignmentSchema,
  updateOrderItemSchema,
  updateOrderItemTravelerSchema,
  updateOrderSchema,
  updateOrderStaffAssignmentSchema,
  updateOrderTermSchema,
  updateOrderTravelerSchema,
} from "./validation.js"

export const transactionOrderRoutes = new Hono<Env>()
  .get("/orders", async (c) => {
    const query = await parseQuery(c, orderListQuerySchema)
    return c.json(await transactionsService.listOrders(c.get("db"), query))
  })
  .post("/orders", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrder(
          c.get("db"),
          await parseJsonBody(c, insertOrderSchema),
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
      await parseJsonBody(c, updateOrderSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order not found")
  })
  .delete("/orders/:id", async (c) => {
    const row = await transactionsService.deleteOrder(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order not found")
  })
  .get("/order-travelers", async (c) => {
    const query = await parseQuery(c, orderTravelerListQuerySchema)
    return c.json(await transactionsService.listOrderTravelers(c.get("db"), query))
  })
  .post("/order-travelers", async (c) => {
    try {
      const payload = await parseJsonBody(c, insertOrderTravelerSchema)
      const row = await transactionsService.createOrderTraveler(c.get("db"), payload)
      if (!row) return c.json({ data: row }, 201)
      if (hasTravelerIdentityInput(payload)) {
        const pii = createPiiService(c, "order", row.orderId)
        await pii.upsertTravelerIdentity(c.get("db"), "order", row.id, payload, c.get("userId"))
        return c.json(
          { data: await transactionsService.getOrderTravelerById(c.get("db"), row.id) },
          201,
        )
      }
      return c.json({ data: row }, 201)
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/order-travelers/:id", async (c) => {
    const row = await transactionsService.getOrderTravelerById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Order traveler not found")
  })
  .patch("/order-travelers/:id", async (c) => {
    try {
      const payload = await parseJsonBody(c, updateOrderTravelerSchema)
      const row = await transactionsService.updateOrderTraveler(
        c.get("db"),
        c.req.param("id"),
        payload,
      )
      if (!row) return notFound(c, "Order traveler not found")
      if (hasTravelerIdentityInput(payload)) {
        const pii = createPiiService(c, "order", row.orderId)
        await pii.upsertTravelerIdentity(c.get("db"), "order", row.id, payload, c.get("userId"))
        return c.json({
          data: await transactionsService.getOrderTravelerById(c.get("db"), row.id),
        })
      }
      return c.json({ data: row })
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/order-travelers/:id/travel-details", async (c) => {
    const traveler = await transactionsService.getOrderTravelerById(c.get("db"), c.req.param("id"))
    if (!traveler) return notFound(c, "Order traveler not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      travelerKind: "order",
      travelerId: traveler.id,
      parentId: traveler.orderId,
      action: "read",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "order", traveler.orderId)
    const row = await pii.getTravelerIdentity(c.get("db"), "order", traveler.id, c.get("userId"))
    if (!row) {
      await logTransactionPiiAccess(c, {
        travelerKind: "order",
        parentId: traveler.orderId,
        travelerId: traveler.id,
        action: "read",
        outcome: "denied",
        reason: "travel_details_not_found",
      })
      return c.json({ error: "Order traveler travel details not found" }, 404)
    }
    return c.json({ data: toTravelerIdentityResponse(row) })
  })
  .patch("/order-travelers/:id/travel-details", async (c) => {
    const traveler = await transactionsService.getOrderTravelerById(c.get("db"), c.req.param("id"))
    if (!traveler) return notFound(c, "Order traveler not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      travelerKind: "order",
      travelerId: traveler.id,
      parentId: traveler.orderId,
      action: "update",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "order", traveler.orderId)
    const row = await pii.upsertTravelerIdentity(
      c.get("db"),
      "order",
      traveler.id,
      await parseJsonBody(c, updateOrderTravelerSchema),
      c.get("userId"),
    )
    return row
      ? c.json({ data: toTravelerIdentityResponse(row) })
      : notFound(c, "Order traveler not found")
  })
  .delete("/order-travelers/:id/travel-details", async (c) => {
    const traveler = await transactionsService.getOrderTravelerById(c.get("db"), c.req.param("id"))
    if (!traveler) return notFound(c, "Order traveler not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      travelerKind: "order",
      travelerId: traveler.id,
      parentId: traveler.orderId,
      action: "delete",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "order", traveler.orderId)
    const row = await pii.deleteTravelerIdentity(c.get("db"), "order", traveler.id, c.get("userId"))
    return row
      ? c.json({ success: true })
      : c.json({ error: "Order traveler travel details not found" }, 404)
  })
  .delete("/order-travelers/:id", async (c) => {
    const row = await transactionsService.deleteOrderTraveler(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order traveler not found")
  })
  .get("/order-contact-assignments", async (c) => {
    const query = await parseQuery(c, orderContactAssignmentListQuerySchema)
    return c.json(await transactionsService.listOrderContactAssignments(c.get("db"), query))
  })
  .post("/order-contact-assignments", async (c) => {
    try {
      const row = await transactionsService.createOrderContactAssignment(
        c.get("db"),
        await parseJsonBody(c, insertOrderContactAssignmentSchema),
      )
      return c.json({ data: row }, 201)
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/order-contact-assignments/:id", async (c) => {
    const row = await transactionsService.getOrderContactAssignmentById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order contact assignment not found")
  })
  .patch("/order-contact-assignments/:id", async (c) => {
    try {
      const row = await transactionsService.updateOrderContactAssignment(
        c.get("db"),
        c.req.param("id"),
        await parseJsonBody(c, updateOrderContactAssignmentSchema),
      )
      return row ? c.json({ data: row }) : notFound(c, "Order contact assignment not found")
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .delete("/order-contact-assignments/:id", async (c) => {
    const row = await transactionsService.deleteOrderContactAssignment(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ success: true }) : notFound(c, "Order contact assignment not found")
  })
  .get("/order-staff-assignments", async (c) => {
    const query = await parseQuery(c, orderStaffAssignmentListQuerySchema)
    return c.json(await transactionsService.listOrderStaffAssignments(c.get("db"), query))
  })
  .post("/order-staff-assignments", async (c) => {
    try {
      const row = await transactionsService.createOrderStaffAssignment(
        c.get("db"),
        await parseJsonBody(c, insertOrderStaffAssignmentSchema),
      )
      return c.json({ data: row }, 201)
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/order-staff-assignments/:id", async (c) => {
    const row = await transactionsService.getOrderStaffAssignmentById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order staff assignment not found")
  })
  .patch("/order-staff-assignments/:id", async (c) => {
    try {
      const row = await transactionsService.updateOrderStaffAssignment(
        c.get("db"),
        c.req.param("id"),
        await parseJsonBody(c, updateOrderStaffAssignmentSchema),
      )
      return row ? c.json({ data: row }) : notFound(c, "Order staff assignment not found")
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .delete("/order-staff-assignments/:id", async (c) => {
    const row = await transactionsService.deleteOrderStaffAssignment(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order staff assignment not found")
  })
  .get("/order-items", async (c) => {
    const query = await parseQuery(c, orderItemListQuerySchema)
    return c.json(await transactionsService.listOrderItems(c.get("db"), query))
  })
  .post("/order-items", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrderItem(
          c.get("db"),
          await parseJsonBody(c, insertOrderItemSchema),
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
      await parseJsonBody(c, updateOrderItemSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order item not found")
  })
  .delete("/order-items/:id", async (c) => {
    const row = await transactionsService.deleteOrderItem(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order item not found")
  })
  .get("/order-item-travelers", async (c) => {
    const query = await parseQuery(c, orderItemTravelerListQuerySchema)
    return c.json(await transactionsService.listOrderItemTravelers(c.get("db"), query))
  })
  .post("/order-item-travelers", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrderItemTraveler(
          c.get("db"),
          await parseJsonBody(c, insertOrderItemTravelerSchema),
        ),
      },
      201,
    ),
  )
  .get("/order-item-travelers/:id", async (c) => {
    const row = await transactionsService.getOrderItemTravelerById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Order item traveler not found")
  })
  .patch("/order-item-travelers/:id", async (c) => {
    const row = await transactionsService.updateOrderItemTraveler(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateOrderItemTravelerSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order item traveler not found")
  })
  .delete("/order-item-travelers/:id", async (c) => {
    const row = await transactionsService.deleteOrderItemTraveler(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order item traveler not found")
  })
  .get("/order-terms", async (c) => {
    const query = await parseQuery(c, orderTermListQuerySchema)
    return c.json(await transactionsService.listOrderTerms(c.get("db"), query))
  })
  .post("/order-terms", async (c) =>
    c.json(
      {
        data: await transactionsService.createOrderTerm(
          c.get("db"),
          await parseJsonBody(c, insertOrderTermSchema),
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
      await parseJsonBody(c, updateOrderTermSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Order term not found")
  })
  .delete("/order-terms/:id", async (c) => {
    const row = await transactionsService.deleteOrderTerm(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Order term not found")
  })
