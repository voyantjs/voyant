import { Hono } from "hono"

import { bookingGroupsService } from "./service-groups.js"
import {
  addBookingGroupMemberSchema,
  bookingGroupListQuerySchema,
  insertBookingGroupSchema,
  updateBookingGroupSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: Parameters<typeof bookingGroupsService.listBookingGroups>[0]
    userId?: string
  }
}

export const bookingGroupRoutes = new Hono<Env>()
  .get("/", async (c) => {
    const query = bookingGroupListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await bookingGroupsService.listBookingGroups(c.get("db"), query))
  })
  .post("/", async (c) => {
    const row = await bookingGroupsService.createBookingGroup(
      c.get("db"),
      insertBookingGroupSchema.parse(await c.req.json()),
    )
    return c.json({ data: row }, 201)
  })
  .get("/:id", async (c) => {
    const row = await bookingGroupsService.getBookingGroupById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Booking group not found" }, 404)
    const members = await bookingGroupsService.listGroupMembers(c.get("db"), row.id)
    return c.json({ data: { ...row, members } })
  })
  .patch("/:id", async (c) => {
    const row = await bookingGroupsService.updateBookingGroup(
      c.get("db"),
      c.req.param("id"),
      updateBookingGroupSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Booking group not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/:id", async (c) => {
    const row = await bookingGroupsService.deleteBookingGroup(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Booking group not found" }, 404)
    return c.json({ success: true })
  })
  .get("/:id/members", async (c) => {
    const members = await bookingGroupsService.listGroupMembers(c.get("db"), c.req.param("id"))
    return c.json({ data: members })
  })
  .post("/:id/members", async (c) => {
    const result = await bookingGroupsService.addGroupMember(
      c.get("db"),
      c.req.param("id"),
      addBookingGroupMemberSchema.parse(await c.req.json()),
    )
    if (result.status === "group_not_found") {
      return c.json({ error: "Booking group not found" }, 404)
    }
    if (result.status === "booking_not_found") {
      return c.json({ error: "Booking not found" }, 404)
    }
    if (result.status === "already_in_group") {
      return c.json(
        {
          error: "Booking is already in a group",
          currentGroupId: result.currentGroupId,
        },
        409,
      )
    }
    return c.json({ data: result.member }, 201)
  })
  .delete("/:id/members/:bookingId", async (c) => {
    const row = await bookingGroupsService.removeGroupMember(
      c.get("db"),
      c.req.param("id"),
      c.req.param("bookingId"),
    )
    if (!row) return c.json({ error: "Membership not found" }, 404)
    return c.json({ success: true })
  })
  .get("/:id/passengers", async (c) => {
    const passengers = await bookingGroupsService.listGroupBookingPassengers(
      c.get("db"),
      c.req.param("id"),
    )
    return c.json({ data: passengers })
  })

export type BookingGroupRoutes = typeof bookingGroupRoutes
