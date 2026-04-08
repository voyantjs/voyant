import { bookings } from "@voyantjs/bookings/schema"
import { newId } from "@voyantjs/db/lib/typeid"
import { cleanupTestDb, createTestDb } from "@voyantjs/db/test-utils"
import { optionUnits, productOptions, products } from "@voyantjs/products/schema"
import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { bookingRequirementsRoutes } from "../../src/routes.js"

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
const DB_AVAILABLE = !!TEST_DATABASE_URL

const db = DB_AVAILABLE ? createTestDb() : (null as never)

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

describe.skipIf(!DB_AVAILABLE)("Booking requirements routes", () => {
  let app: Hono
  let productId: string
  let optionId: string
  let unitId: string
  let bookingId: string

  beforeAll(() => {
    productId = newId("products")
    optionId = newId("product_options")
    unitId = newId("option_units")
    bookingId = newId("bookings")

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", bookingRequirementsRoutes)
  })

  beforeEach(async () => {
    await cleanupTestDb(db)
    await db.insert(products).values({
      id: productId,
      name: "Test Product",
      sellCurrency: "USD",
    })
    await db.insert(productOptions).values({
      id: optionId,
      productId,
      name: "Test Option",
    })
    await db.insert(optionUnits).values({
      id: unitId,
      optionId,
      name: "Adult",
    })
    await db.insert(bookings).values({
      id: bookingId,
      bookingNumber: `BK-${Date.now()}`,
      productId,
      sellCurrency: "USD",
    })
  })

  describe("Contact Requirements", () => {
    const validReq = () => ({ productId, fieldKey: "email" })

    it("creates a contact requirement", async () => {
      const res = await app.request("/contact-requirements", {
        method: "POST",
        ...json(validReq()),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.fieldKey).toBe("email")
      expect(body.data.scope).toBe("participant")
      expect(body.data.active).toBe(true)
      expect(body.data.id).toBeTruthy()
    })

    it("lists contact requirements", async () => {
      await app.request("/contact-requirements", { method: "POST", ...json(validReq()) })
      const res = await app.request("/contact-requirements", { method: "GET" })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.total).toBe(1)
    })

    it("gets a contact requirement by id", async () => {
      const createRes = await app.request("/contact-requirements", {
        method: "POST",
        ...json(validReq()),
      })
      const { data: created } = await createRes.json()
      const res = await app.request(`/contact-requirements/${created.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      expect((await res.json()).data.fieldKey).toBe("email")
    })

    it("updates a contact requirement", async () => {
      const createRes = await app.request("/contact-requirements", {
        method: "POST",
        ...json(validReq()),
      })
      const { data: created } = await createRes.json()
      const res = await app.request(`/contact-requirements/${created.id}`, {
        method: "PATCH",
        ...json({ isRequired: true }),
      })
      expect(res.status).toBe(200)
      expect((await res.json()).data.isRequired).toBe(true)
    })

    it("deletes a contact requirement", async () => {
      const createRes = await app.request("/contact-requirements", {
        method: "POST",
        ...json(validReq()),
      })
      const { data: created } = await createRes.json()
      const res = await app.request(`/contact-requirements/${created.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
    })

    it("returns 404 for non-existent contact requirement", async () => {
      const res = await app.request("/contact-requirements/pcre_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Product Booking Questions", () => {
    const validQuestion = () => ({ productId, label: "Dietary needs?" })

    it("creates a question", async () => {
      const res = await app.request("/questions", { method: "POST", ...json(validQuestion()) })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.label).toBe("Dietary needs?")
      expect(body.data.target).toBe("booking")
      expect(body.data.fieldType).toBe("text")
      expect(body.data.id).toBeTruthy()
    })

    it("lists questions", async () => {
      await app.request("/questions", { method: "POST", ...json(validQuestion()) })
      const res = await app.request("/questions", { method: "GET" })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.total).toBe(1)
    })

    it("gets a question by id", async () => {
      const createRes = await app.request("/questions", {
        method: "POST",
        ...json(validQuestion()),
      })
      const { data: created } = await createRes.json()
      const res = await app.request(`/questions/${created.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      expect((await res.json()).data.label).toBe("Dietary needs?")
    })

    it("updates a question", async () => {
      const createRes = await app.request("/questions", {
        method: "POST",
        ...json(validQuestion()),
      })
      const { data: created } = await createRes.json()
      const res = await app.request(`/questions/${created.id}`, {
        method: "PATCH",
        ...json({ label: "Updated label" }),
      })
      expect(res.status).toBe(200)
      expect((await res.json()).data.label).toBe("Updated label")
    })

    it("deletes a question", async () => {
      const createRes = await app.request("/questions", {
        method: "POST",
        ...json(validQuestion()),
      })
      const { data: created } = await createRes.json()
      const res = await app.request(`/questions/${created.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
    })

    it("returns 404 for non-existent question", async () => {
      const res = await app.request("/questions/pbqq_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Question Options (FK → Questions)", () => {
    async function seedQuestion() {
      const res = await app.request("/questions", {
        method: "POST",
        ...json({ productId, label: "Pick size", fieldType: "single_select" }),
      })
      return (await res.json()).data
    }

    it("creates a question option", async () => {
      const question = await seedQuestion()
      const res = await app.request("/question-options", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, value: "small", label: "Small" }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.value).toBe("small")
      expect(body.data.label).toBe("Small")
      expect(body.data.isDefault).toBe(false)
    })

    it("lists question options filtered by questionId", async () => {
      const question = await seedQuestion()
      await app.request("/question-options", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, value: "small", label: "Small" }),
      })
      const res = await app.request(`/question-options?productBookingQuestionId=${question.id}`, {
        method: "GET",
      })
      expect(res.status).toBe(200)
      expect((await res.json()).data.length).toBe(1)
    })

    it("CRUD cycle for question option", async () => {
      const question = await seedQuestion()
      const createRes = await app.request("/question-options", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, value: "medium", label: "Medium" }),
      })
      const { data: opt } = await createRes.json()

      const getRes = await app.request(`/question-options/${opt.id}`, { method: "GET" })
      expect(getRes.status).toBe(200)

      const updateRes = await app.request(`/question-options/${opt.id}`, {
        method: "PATCH",
        ...json({ isDefault: true }),
      })
      expect((await updateRes.json()).data.isDefault).toBe(true)

      const deleteRes = await app.request(`/question-options/${opt.id}`, { method: "DELETE" })
      expect((await deleteRes.json()).success).toBe(true)
    })

    it("returns 404 for non-existent question option", async () => {
      const res = await app.request("/question-options/bqop_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Option Booking Questions (FK → Questions)", () => {
    async function seedQuestion() {
      const res = await app.request("/questions", {
        method: "POST",
        ...json({ productId, label: "Allergies?" }),
      })
      return (await res.json()).data
    }

    it("creates an option booking question", async () => {
      const question = await seedQuestion()
      const res = await app.request("/option-questions", {
        method: "POST",
        ...json({ optionId, productBookingQuestionId: question.id }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.optionId).toBe(optionId)
      expect(body.data.productBookingQuestionId).toBe(question.id)
    })

    it("CRUD cycle for option booking question", async () => {
      const question = await seedQuestion()
      const createRes = await app.request("/option-questions", {
        method: "POST",
        ...json({ optionId, productBookingQuestionId: question.id }),
      })
      const { data: oq } = await createRes.json()

      const getRes = await app.request(`/option-questions/${oq.id}`, { method: "GET" })
      expect(getRes.status).toBe(200)

      const updateRes = await app.request(`/option-questions/${oq.id}`, {
        method: "PATCH",
        ...json({ isRequiredOverride: true }),
      })
      expect((await updateRes.json()).data.isRequiredOverride).toBe(true)

      const deleteRes = await app.request(`/option-questions/${oq.id}`, { method: "DELETE" })
      expect((await deleteRes.json()).success).toBe(true)
    })

    it("returns 404 for non-existent option booking question", async () => {
      const res = await app.request("/option-questions/obqq_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Unit Triggers (FK → Questions)", () => {
    async function seedQuestion() {
      const res = await app.request("/questions", {
        method: "POST",
        ...json({ productId, label: "Weight?" }),
      })
      return (await res.json()).data
    }

    it("creates a unit trigger", async () => {
      const question = await seedQuestion()
      const res = await app.request("/unit-triggers", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, unitId }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.triggerMode).toBe("required")
      expect(body.data.active).toBe(true)
    })

    it("CRUD cycle for unit trigger", async () => {
      const question = await seedQuestion()
      const createRes = await app.request("/unit-triggers", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, unitId }),
      })
      const { data: trigger } = await createRes.json()

      const getRes = await app.request(`/unit-triggers/${trigger.id}`, { method: "GET" })
      expect(getRes.status).toBe(200)

      const updateRes = await app.request(`/unit-triggers/${trigger.id}`, {
        method: "PATCH",
        ...json({ triggerMode: "optional" }),
      })
      expect((await updateRes.json()).data.triggerMode).toBe("optional")

      const deleteRes = await app.request(`/unit-triggers/${trigger.id}`, { method: "DELETE" })
      expect((await deleteRes.json()).success).toBe(true)
    })

    it("returns 404 for non-existent unit trigger", async () => {
      const res = await app.request("/unit-triggers/bqut_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Option Triggers (FK → Questions)", () => {
    async function seedQuestion() {
      const res = await app.request("/questions", {
        method: "POST",
        ...json({ productId, label: "Special request?" }),
      })
      return (await res.json()).data
    }

    it("creates an option trigger", async () => {
      const question = await seedQuestion()
      const res = await app.request("/option-triggers", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, optionId }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.triggerMode).toBe("required")
    })

    it("CRUD cycle for option trigger", async () => {
      const question = await seedQuestion()
      const createRes = await app.request("/option-triggers", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id, optionId }),
      })
      const { data: trigger } = await createRes.json()

      const getRes = await app.request(`/option-triggers/${trigger.id}`, { method: "GET" })
      expect(getRes.status).toBe(200)

      const updateRes = await app.request(`/option-triggers/${trigger.id}`, {
        method: "PATCH",
        ...json({ triggerMode: "hidden" }),
      })
      expect((await updateRes.json()).data.triggerMode).toBe("hidden")

      const deleteRes = await app.request(`/option-triggers/${trigger.id}`, { method: "DELETE" })
      expect((await deleteRes.json()).success).toBe(true)
    })

    it("returns 404 for non-existent option trigger", async () => {
      const res = await app.request("/option-triggers/bqot_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Extra Triggers (FK → Questions)", () => {
    async function seedQuestion() {
      const res = await app.request("/questions", {
        method: "POST",
        ...json({ productId, label: "Extra info?" }),
      })
      return (await res.json()).data
    }

    it("creates an extra trigger", async () => {
      const question = await seedQuestion()
      const res = await app.request("/extra-triggers", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.triggerMode).toBe("required")
      expect(body.data.active).toBe(true)
    })

    it("CRUD cycle for extra trigger", async () => {
      const question = await seedQuestion()
      const createRes = await app.request("/extra-triggers", {
        method: "POST",
        ...json({ productBookingQuestionId: question.id }),
      })
      const { data: trigger } = await createRes.json()

      const getRes = await app.request(`/extra-triggers/${trigger.id}`, { method: "GET" })
      expect(getRes.status).toBe(200)

      const updateRes = await app.request(`/extra-triggers/${trigger.id}`, {
        method: "PATCH",
        ...json({ triggerMode: "optional", minQuantity: 3 }),
      })
      const updated = (await updateRes.json()).data
      expect(updated.triggerMode).toBe("optional")
      expect(updated.minQuantity).toBe(3)

      const deleteRes = await app.request(`/extra-triggers/${trigger.id}`, { method: "DELETE" })
      expect((await deleteRes.json()).success).toBe(true)
    })

    it("returns 404 for non-existent extra trigger", async () => {
      const res = await app.request("/extra-triggers/bqet_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })

  describe("Booking Answers (FK → Questions)", () => {
    async function seedQuestion() {
      const res = await app.request("/questions", {
        method: "POST",
        ...json({ productId, label: "Name?" }),
      })
      return (await res.json()).data
    }

    it("creates an answer", async () => {
      const question = await seedQuestion()
      const res = await app.request("/answers", {
        method: "POST",
        ...json({
          bookingId,
          productBookingQuestionId: question.id,
          valueText: "John Doe",
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.valueText).toBe("John Doe")
      expect(body.data.target).toBe("booking")
    })

    it("lists answers filtered by bookingId", async () => {
      const question = await seedQuestion()
      await app.request("/answers", {
        method: "POST",
        ...json({
          bookingId,
          productBookingQuestionId: question.id,
          valueText: "Jane",
        }),
      })
      const res = await app.request(`/answers?bookingId=${bookingId}`, { method: "GET" })
      expect(res.status).toBe(200)
      expect((await res.json()).data.length).toBe(1)
    })

    it("CRUD cycle for answer", async () => {
      const question = await seedQuestion()
      const createRes = await app.request("/answers", {
        method: "POST",
        ...json({
          bookingId,
          productBookingQuestionId: question.id,
          valueText: "Initial",
        }),
      })
      const { data: answer } = await createRes.json()

      const getRes = await app.request(`/answers/${answer.id}`, { method: "GET" })
      expect(getRes.status).toBe(200)

      const updateRes = await app.request(`/answers/${answer.id}`, {
        method: "PATCH",
        ...json({ valueText: "Updated" }),
      })
      expect((await updateRes.json()).data.valueText).toBe("Updated")

      const deleteRes = await app.request(`/answers/${answer.id}`, { method: "DELETE" })
      expect((await deleteRes.json()).success).toBe(true)
    })

    it("returns 404 for non-existent answer", async () => {
      const res = await app.request("/answers/bqan_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })
  })
})
