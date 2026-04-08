import {
  insertAddressForEntitySchema,
  insertContactPointForEntitySchema,
  insertNamedContactForEntitySchema,
  updateAddressSchema as updateIdentityAddressSchema,
  updateContactPointSchema as updateIdentityContactPointSchema,
  updateNamedContactSchema as updateIdentityNamedContactSchema,
} from "@voyantjs/identity/validation"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { suppliersService } from "./service.js"
import {
  availabilityQuerySchema,
  insertAvailabilitySchema,
  insertContractSchema,
  insertRateSchema,
  insertServiceSchema,
  insertSupplierNoteSchema,
  insertSupplierSchema,
  supplierListQuerySchema,
  updateContractSchema,
  updateRateSchema,
  updateServiceSchema,
  updateSupplierSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

// ==========================================================================
// Suppliers — method-chained for Hono RPC type inference
// ==========================================================================

export const supplierRoutes = new Hono<Env>()

  // ========================================================================
  // Suppliers CRUD
  // ========================================================================

  // GET / — List suppliers
  .get("/", async (c) => {
    const query = supplierListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await suppliersService.listSuppliers(c.get("db"), query))
  })

  // PATCH /contact-points/:contactPointId — Update supplier contact point
  .patch("/contact-points/:contactPointId", async (c) => {
    const row = await suppliersService.updateContactPoint(
      c.get("db"),
      c.req.param("contactPointId"),
      updateIdentityContactPointSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Contact point not found" }, 404)
    }

    return c.json({ data: row })
  })

  // PATCH /contacts/:contactId — Update supplier named contact
  .patch("/contacts/:contactId", async (c) => {
    const row = await suppliersService.updateNamedContact(
      c.get("db"),
      c.req.param("contactId"),
      updateIdentityNamedContactSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Contact not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /contacts/:contactId — Delete supplier named contact
  .delete("/contacts/:contactId", async (c) => {
    const row = await suppliersService.deleteNamedContact(c.get("db"), c.req.param("contactId"))

    if (!row) {
      return c.json({ error: "Contact not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // DELETE /contact-points/:contactPointId — Delete supplier contact point
  .delete("/contact-points/:contactPointId", async (c) => {
    const row = await suppliersService.deleteContactPoint(
      c.get("db"),
      c.req.param("contactPointId"),
    )

    if (!row) {
      return c.json({ error: "Contact point not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // PATCH /addresses/:addressId — Update supplier address
  .patch("/addresses/:addressId", async (c) => {
    const row = await suppliersService.updateAddress(
      c.get("db"),
      c.req.param("addressId"),
      updateIdentityAddressSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Address not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /addresses/:addressId — Delete supplier address
  .delete("/addresses/:addressId", async (c) => {
    const row = await suppliersService.deleteAddress(c.get("db"), c.req.param("addressId"))

    if (!row) {
      return c.json({ error: "Address not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // GET /:id — Get single supplier
  .get("/:id", async (c) => {
    const row = await suppliersService.getSupplierById(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row })
  })

  // POST / — Create supplier
  .post("/", async (c) => {
    const data = insertSupplierSchema.parse(await c.req.json())
    return c.json({ data: await suppliersService.createSupplier(c.get("db"), data) }, 201)
  })

  // PATCH /:id — Update supplier
  .patch("/:id", async (c) => {
    const row = await suppliersService.updateSupplier(
      c.get("db"),
      c.req.param("id"),
      updateSupplierSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id — Delete supplier
  .delete("/:id", async (c) => {
    const row = await suppliersService.deleteSupplier(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // GET /:id/contact-points — List shared contact points for a supplier
  .get("/:id/contact-points", async (c) => {
    return c.json({
      data: await suppliersService.listContactPoints(c.get("db"), c.req.param("id")),
    })
  })

  // POST /:id/contact-points — Create shared contact point for a supplier
  .post("/:id/contact-points", async (c) => {
    const row = await suppliersService.createContactPoint(
      c.get("db"),
      c.req.param("id"),
      insertContactPointForEntitySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // GET /:id/contacts — List shared named contacts for a supplier
  .get("/:id/contacts", async (c) => {
    return c.json({
      data: await suppliersService.listNamedContacts(c.get("db"), c.req.param("id")),
    })
  })

  // POST /:id/contacts — Create shared named contact for a supplier
  .post("/:id/contacts", async (c) => {
    const row = await suppliersService.createNamedContact(
      c.get("db"),
      c.req.param("id"),
      insertNamedContactForEntitySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // GET /:id/addresses — List shared addresses for a supplier
  .get("/:id/addresses", async (c) => {
    return c.json({ data: await suppliersService.listAddresses(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/addresses — Create shared address for a supplier
  .post("/:id/addresses", async (c) => {
    const row = await suppliersService.createAddress(
      c.get("db"),
      c.req.param("id"),
      insertAddressForEntitySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // ========================================================================
  // Services
  // ========================================================================

  // GET /:id/services — List services for a supplier
  .get("/:id/services", async (c) => {
    return c.json({ data: await suppliersService.listServices(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/services — Add service to supplier
  .post("/:id/services", async (c) => {
    const row = await suppliersService.createService(
      c.get("db"),
      c.req.param("id"),
      insertServiceSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /:id/services/:serviceId — Update service
  .patch("/:id/services/:serviceId", async (c) => {
    const row = await suppliersService.updateService(
      c.get("db"),
      c.req.param("serviceId"),
      updateServiceSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Service not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id/services/:serviceId — Delete service
  .delete("/:id/services/:serviceId", async (c) => {
    const row = await suppliersService.deleteService(c.get("db"), c.req.param("serviceId"))

    if (!row) {
      return c.json({ error: "Service not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ========================================================================
  // Rates
  // ========================================================================

  // GET /:id/services/:serviceId/rates — List rates for a service
  .get("/:id/services/:serviceId/rates", async (c) => {
    return c.json({
      data: await suppliersService.listRates(c.get("db"), c.req.param("serviceId")),
    })
  })

  // POST /:id/services/:serviceId/rates — Add rate to service
  .post("/:id/services/:serviceId/rates", async (c) => {
    const row = await suppliersService.createRate(
      c.get("db"),
      c.req.param("serviceId"),
      insertRateSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Service not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /:id/services/:serviceId/rates/:rateId — Update rate
  .patch("/:id/services/:serviceId/rates/:rateId", async (c) => {
    const row = await suppliersService.updateRate(
      c.get("db"),
      c.req.param("rateId"),
      updateRateSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Rate not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id/services/:serviceId/rates/:rateId — Delete rate
  .delete("/:id/services/:serviceId/rates/:rateId", async (c) => {
    const row = await suppliersService.deleteRate(c.get("db"), c.req.param("rateId"))

    if (!row) {
      return c.json({ error: "Rate not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ========================================================================
  // Notes
  // ========================================================================

  // GET /:id/notes — List notes for supplier
  .get("/:id/notes", async (c) => {
    return c.json({ data: await suppliersService.listNotes(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/notes — Add note to supplier
  .post("/:id/notes", async (c) => {
    const userId = c.get("userId")

    if (!userId) {
      return c.json({ error: "User ID required to create notes" }, 400)
    }

    const row = await suppliersService.createNote(
      c.get("db"),
      c.req.param("id"),
      userId,
      insertSupplierNoteSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // ========================================================================
  // Availability
  // ========================================================================

  // GET /:id/availability — List availability entries
  .get("/:id/availability", async (c) => {
    const query = availabilityQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json({
      data: await suppliersService.listAvailability(c.get("db"), c.req.param("id"), query),
    })
  })

  // POST /:id/availability — Add availability entries (bulk)
  .post("/:id/availability", async (c) => {
    const body = await c.req.json()
    const entries = Array.isArray(body) ? body : [body]
    const row = await suppliersService.createAvailability(
      c.get("db"),
      c.req.param("id"),
      entries.map((entry) => insertAvailabilitySchema.parse(entry)),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // ========================================================================
  // Contracts
  // ========================================================================

  // GET /:id/contracts — List contracts
  .get("/:id/contracts", async (c) => {
    return c.json({ data: await suppliersService.listContracts(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/contracts — Create contract
  .post("/:id/contracts", async (c) => {
    const row = await suppliersService.createContract(
      c.get("db"),
      c.req.param("id"),
      insertContractSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Supplier not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /:id/contracts/:contractId — Update contract
  .patch("/:id/contracts/:contractId", async (c) => {
    const row = await suppliersService.updateContract(
      c.get("db"),
      c.req.param("contractId"),
      updateContractSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Contract not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id/contracts/:contractId — Delete contract
  .delete("/:id/contracts/:contractId", async (c) => {
    const row = await suppliersService.deleteContract(c.get("db"), c.req.param("contractId"))

    if (!row) {
      return c.json({ error: "Contract not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

export type SupplierRoutes = typeof supplierRoutes
