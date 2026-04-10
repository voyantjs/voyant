import { describe, expect, it } from "vitest"

import {
  insertOpportunitySchema,
  insertPipelineSchema,
  insertQuoteSchema,
  insertStageSchema,
} from "../../src/validation.js"

describe("Pipeline schemas", () => {
  it("applies defaults", () => {
    const result = insertPipelineSchema.parse({ name: "Sales" })
    expect(result.entityType).toBe("opportunity")
    expect(result.isDefault).toBe(false)
    expect(result.sortOrder).toBe(0)
  })

  it("rejects empty name", () => {
    expect(() => insertPipelineSchema.parse({ name: "" })).toThrow()
  })
})

describe("Stage schemas", () => {
  it("requires pipelineId", () => {
    const result = insertStageSchema.parse({
      pipelineId: "crm_pip_abc",
      name: "Prospecting",
    })
    expect(result.pipelineId).toBe("crm_pip_abc")
  })

  it("rejects missing pipelineId", () => {
    expect(() => insertStageSchema.parse({ name: "Prospecting" })).toThrow()
  })

  it("accepts probability in range 0-100", () => {
    const result = insertStageSchema.parse({
      pipelineId: "crm_pip_abc",
      name: "Closing",
      probability: 75,
    })
    expect(result.probability).toBe(75)
  })

  it("rejects probability over 100", () => {
    expect(() =>
      insertStageSchema.parse({
        pipelineId: "crm_pip_abc",
        name: "Closing",
        probability: 150,
      }),
    ).toThrow()
  })

  it("rejects negative probability", () => {
    expect(() =>
      insertStageSchema.parse({
        pipelineId: "crm_pip_abc",
        name: "Closing",
        probability: -1,
      }),
    ).toThrow()
  })
})

describe("Opportunity schemas", () => {
  const validOpportunity = {
    title: "Big Deal",
    pipelineId: "crm_pip_abc",
    stageId: "crm_stg_abc",
  }

  it("requires title, pipelineId, stageId", () => {
    const result = insertOpportunitySchema.parse(validOpportunity)
    expect(result.title).toBe("Big Deal")
    expect(result.status).toBe("open")
    expect(result.tags).toEqual([])
  })

  it("rejects missing title", () => {
    expect(() =>
      insertOpportunitySchema.parse({
        pipelineId: "crm_pip_abc",
        stageId: "crm_stg_abc",
      }),
    ).toThrow()
  })

  it("accepts valid status enum", () => {
    const result = insertOpportunitySchema.parse({ ...validOpportunity, status: "won" })
    expect(result.status).toBe("won")
  })

  it("rejects invalid status enum", () => {
    expect(() =>
      insertOpportunitySchema.parse({ ...validOpportunity, status: "invalid" }),
    ).toThrow()
  })
})

describe("Quote schemas", () => {
  it("requires opportunityId and currency", () => {
    const result = insertQuoteSchema.parse({
      opportunityId: "crm_opp_abc",
      currency: "USD",
    })
    expect(result.opportunityId).toBe("crm_opp_abc")
    expect(result.currency).toBe("USD")
    expect(result.subtotalAmountCents).toBe(0)
    expect(result.taxAmountCents).toBe(0)
    expect(result.totalAmountCents).toBe(0)
    expect(result.status).toBe("draft")
  })

  it("rejects missing currency", () => {
    expect(() => insertQuoteSchema.parse({ opportunityId: "crm_opp_abc" })).toThrow()
  })
})
