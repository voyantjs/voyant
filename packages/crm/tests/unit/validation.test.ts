import { describe, expect, it } from "vitest"

import {
  activityListQuerySchema,
  communicationChannelSchema,
  communicationDirectionSchema,
  communicationListQuerySchema,
  customFieldDefinitionListQuerySchema,
  insertActivitySchema,
  insertCommunicationLogSchema,
  insertCustomFieldDefinitionSchema,
  insertOpportunitySchema,
  insertOrganizationNoteSchema,
  insertOrganizationSchema,
  insertPersonNoteSchema,
  insertPersonSchema,
  insertPipelineSchema,
  insertQuoteSchema,
  insertSegmentSchema,
  insertStageSchema,
  organizationListQuerySchema,
  personListQuerySchema,
  relationTypeSchema,
  updateOrganizationSchema,
  updatePersonSchema,
  upsertCustomFieldValueSchema,
} from "../../src/validation.js"

// ---------- Organization ----------

describe("Organization schemas", () => {
  it("accepts valid input with defaults", () => {
    const result = insertOrganizationSchema.parse({ name: "Acme Corp" })
    expect(result.name).toBe("Acme Corp")
    expect(result.status).toBe("active")
    expect(result.tags).toEqual([])
  })

  it("rejects empty name", () => {
    expect(() => insertOrganizationSchema.parse({ name: "" })).toThrow()
  })

  it("transforms empty website to null", () => {
    const result = insertOrganizationSchema.parse({ name: "Acme", website: "" })
    expect(result.website).toBeNull()
  })

  it("accepts valid website URL", () => {
    const result = insertOrganizationSchema.parse({
      name: "Acme",
      website: "https://acme.com",
    })
    expect(result.website).toBe("https://acme.com")
  })

  it("rejects invalid website URL", () => {
    expect(() => insertOrganizationSchema.parse({ name: "Acme", website: "not-a-url" })).toThrow()
  })

  it("allows partial updates with only provided fields", () => {
    const result = updateOrganizationSchema.parse({ name: "New Name" })
    expect(result.name).toBe("New Name")
    expect(result.status).toBe("active")
    expect(result.legalName).toBeUndefined()
  })

  it("accepts relation enum", () => {
    const result = insertOrganizationSchema.parse({ name: "Acme", relation: "client" })
    expect(result.relation).toBe("client")
  })

  it("rejects invalid relation", () => {
    expect(() => insertOrganizationSchema.parse({ name: "Acme", relation: "invalid" })).toThrow()
  })

  it("accepts paymentTerms as positive integer", () => {
    const result = insertOrganizationSchema.parse({ name: "Acme", paymentTerms: 30 })
    expect(result.paymentTerms).toBe(30)
  })

  it("rejects negative paymentTerms", () => {
    expect(() => insertOrganizationSchema.parse({ name: "Acme", paymentTerms: -1 })).toThrow()
  })

  it("rejects zero paymentTerms", () => {
    expect(() => insertOrganizationSchema.parse({ name: "Acme", paymentTerms: 0 })).toThrow()
  })

  it("accepts preferredLanguage", () => {
    const result = insertOrganizationSchema.parse({ name: "Acme", preferredLanguage: "en" })
    expect(result.preferredLanguage).toBe("en")
  })
})

// ---------- Person ----------

describe("Person schemas", () => {
  it("requires firstName and lastName", () => {
    const result = insertPersonSchema.parse({ firstName: "John", lastName: "Doe" })
    expect(result.firstName).toBe("John")
    expect(result.lastName).toBe("Doe")
    expect(result.status).toBe("active")
    expect(result.tags).toEqual([])
  })

  it("rejects missing firstName", () => {
    expect(() => insertPersonSchema.parse({ lastName: "Doe" })).toThrow()
  })

  it("rejects missing lastName", () => {
    expect(() => insertPersonSchema.parse({ firstName: "John" })).toThrow()
  })

  it("accepts valid birthday date", () => {
    const result = insertPersonSchema.parse({
      firstName: "John",
      lastName: "Doe",
      birthday: "1990-01-15",
    })
    expect(result.birthday).toBe("1990-01-15")
  })

  it("rejects invalid birthday format", () => {
    expect(() =>
      insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        birthday: "not-a-date",
      }),
    ).toThrow()
  })

  it("accepts relation enum", () => {
    const result = insertPersonSchema.parse({
      firstName: "John",
      lastName: "Doe",
      relation: "supplier",
    })
    expect(result.relation).toBe("supplier")
  })

  it("accepts preferredLanguage and preferredCurrency", () => {
    const result = insertPersonSchema.parse({
      firstName: "John",
      lastName: "Doe",
      preferredLanguage: "fr",
      preferredCurrency: "EUR",
    })
    expect(result.preferredLanguage).toBe("fr")
    expect(result.preferredCurrency).toBe("EUR")
  })

  describe("inline identity fields", () => {
    it("accepts valid email", () => {
      const result = insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      })
      expect(result.email).toBe("john@example.com")
    })

    it("rejects invalid email", () => {
      expect(() =>
        insertPersonSchema.parse({
          firstName: "John",
          lastName: "Doe",
          email: "not-an-email",
        }),
      ).toThrow()
    })

    it("accepts null email", () => {
      const result = insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        email: null,
      })
      expect(result.email).toBeNull()
    })

    it("accepts phone number", () => {
      const result = insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        phone: "+1-555-123-4567",
      })
      expect(result.phone).toBe("+1-555-123-4567")
    })

    it("accepts valid website URL", () => {
      const result = insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        website: "https://johndoe.com",
      })
      expect(result.website).toBe("https://johndoe.com")
    })

    it("transforms empty website to null", () => {
      const result = insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        website: "",
      })
      expect(result.website).toBeNull()
    })

    it("rejects invalid website URL", () => {
      expect(() =>
        insertPersonSchema.parse({
          firstName: "John",
          lastName: "Doe",
          website: "not-a-url",
        }),
      ).toThrow()
    })

    it("accepts address, city, country", () => {
      const result = insertPersonSchema.parse({
        firstName: "John",
        lastName: "Doe",
        address: "123 Main St",
        city: "Springfield",
        country: "US",
      })
      expect(result.address).toBe("123 Main St")
      expect(result.city).toBe("Springfield")
      expect(result.country).toBe("US")
    })

    it("identity fields are absent or null when omitted", () => {
      const result = insertPersonSchema.parse({ firstName: "John", lastName: "Doe" })
      expect(result.email).toBeUndefined()
      expect(result.phone).toBeUndefined()
      // website has a .transform() that produces null when not provided
      expect(result.website).toBeNull()
      expect(result.address).toBeUndefined()
      expect(result.city).toBeUndefined()
      expect(result.country).toBeUndefined()
    })
  })

  describe("partial update", () => {
    it("allows updating only firstName", () => {
      const result = updatePersonSchema.parse({ firstName: "Jane" })
      expect(result.firstName).toBe("Jane")
      expect(result.lastName).toBeUndefined()
    })

    it("allows updating identity fields independently", () => {
      const result = updatePersonSchema.parse({ email: "new@example.com" })
      expect(result.email).toBe("new@example.com")
    })
  })
})

// ---------- Pipeline ----------

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

// ---------- Stage ----------

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

// ---------- Opportunity ----------

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

// ---------- Quote ----------

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

// ---------- Activity ----------

describe("Activity schemas", () => {
  it("requires subject and type", () => {
    const result = insertActivitySchema.parse({
      subject: "Follow-up call",
      type: "call",
    })
    expect(result.subject).toBe("Follow-up call")
    expect(result.type).toBe("call")
    expect(result.status).toBe("planned")
  })

  it("rejects missing type", () => {
    expect(() => insertActivitySchema.parse({ subject: "Follow-up" })).toThrow()
  })

  it("rejects invalid status enum", () => {
    expect(() =>
      insertActivitySchema.parse({
        subject: "Call",
        type: "call",
        status: "invalid",
      }),
    ).toThrow()
  })

  it("accepts datetime format for dueAt", () => {
    const result = insertActivitySchema.parse({
      subject: "Call",
      type: "call",
      dueAt: "2024-06-15T14:00:00Z",
    })
    expect(result.dueAt).toBe("2024-06-15T14:00:00Z")
  })

  it("rejects invalid dueAt format", () => {
    expect(() =>
      insertActivitySchema.parse({
        subject: "Call",
        type: "call",
        dueAt: "not-a-datetime",
      }),
    ).toThrow()
  })
})

// ---------- Custom fields ----------

describe("Custom field definition schemas", () => {
  const validDef = {
    entityType: "organization",
    key: "industry_code",
    label: "Industry Code",
    fieldType: "varchar",
  }

  it("requires entityType, key, label, fieldType", () => {
    const result = insertCustomFieldDefinitionSchema.parse(validDef)
    expect(result.entityType).toBe("organization")
    expect(result.key).toBe("industry_code")
    expect(result.isRequired).toBe(false)
    expect(result.isSearchable).toBe(false)
  })

  it("rejects missing entityType", () => {
    expect(() =>
      insertCustomFieldDefinitionSchema.parse({
        key: "k",
        label: "L",
        fieldType: "varchar",
      }),
    ).toThrow()
  })

  it("accepts options array shape", () => {
    const result = insertCustomFieldDefinitionSchema.parse({
      ...validDef,
      fieldType: "enum",
      options: [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
      ],
    })
    expect(result.options).toHaveLength(2)
  })
})

describe("Custom field value upsert schema", () => {
  it("requires entityType and entityId", () => {
    const result = upsertCustomFieldValueSchema.parse({
      entityType: "organization",
      entityId: "crm_org_abc",
      textValue: "hello",
    })
    expect(result.entityType).toBe("organization")
    expect(result.entityId).toBe("crm_org_abc")
  })

  it("rejects missing entityType", () => {
    expect(() => upsertCustomFieldValueSchema.parse({ entityId: "crm_org_abc" })).toThrow()
  })

  it("rejects missing entityId", () => {
    expect(() => upsertCustomFieldValueSchema.parse({ entityType: "organization" })).toThrow()
  })
})

// ---------- Notes ----------

describe("Person note schemas", () => {
  it("accepts valid content", () => {
    const result = insertPersonNoteSchema.parse({ content: "Called to follow up on proposal" })
    expect(result.content).toBe("Called to follow up on proposal")
  })

  it("rejects empty content", () => {
    expect(() => insertPersonNoteSchema.parse({ content: "" })).toThrow()
  })

  it("rejects content over 10000 chars", () => {
    expect(() => insertPersonNoteSchema.parse({ content: "x".repeat(10001) })).toThrow()
  })

  it("accepts content at max length", () => {
    const result = insertPersonNoteSchema.parse({ content: "x".repeat(10000) })
    expect(result.content).toHaveLength(10000)
  })
})

describe("Organization note schemas", () => {
  it("accepts valid content", () => {
    const result = insertOrganizationNoteSchema.parse({ content: "Updated payment terms" })
    expect(result.content).toBe("Updated payment terms")
  })

  it("rejects empty content", () => {
    expect(() => insertOrganizationNoteSchema.parse({ content: "" })).toThrow()
  })

  it("rejects content over 10000 chars", () => {
    expect(() => insertOrganizationNoteSchema.parse({ content: "x".repeat(10001) })).toThrow()
  })
})

// ---------- Communication log ----------

describe("Communication log schemas", () => {
  it("accepts valid communication log entry", () => {
    const result = insertCommunicationLogSchema.parse({
      channel: "email",
      direction: "outbound",
      subject: "Follow-up email",
      content: "Sent pricing details",
    })
    expect(result.channel).toBe("email")
    expect(result.direction).toBe("outbound")
    expect(result.subject).toBe("Follow-up email")
    expect(result.content).toBe("Sent pricing details")
  })

  it("requires channel and direction", () => {
    expect(() => insertCommunicationLogSchema.parse({ direction: "inbound" })).toThrow()
    expect(() => insertCommunicationLogSchema.parse({ channel: "email" })).toThrow()
  })

  it("rejects invalid channel", () => {
    expect(() =>
      insertCommunicationLogSchema.parse({ channel: "telegram", direction: "inbound" }),
    ).toThrow()
  })

  it("rejects invalid direction", () => {
    expect(() =>
      insertCommunicationLogSchema.parse({ channel: "email", direction: "both" }),
    ).toThrow()
  })

  it("accepts all valid channels", () => {
    for (const channel of ["email", "phone", "whatsapp", "sms", "meeting", "other"]) {
      const result = insertCommunicationLogSchema.parse({ channel, direction: "inbound" })
      expect(result.channel).toBe(channel)
    }
  })

  it("accepts optional organizationId", () => {
    const result = insertCommunicationLogSchema.parse({
      channel: "phone",
      direction: "inbound",
      organizationId: "org_123",
    })
    expect(result.organizationId).toBe("org_123")
  })

  it("accepts optional sentAt timestamp", () => {
    const result = insertCommunicationLogSchema.parse({
      channel: "email",
      direction: "outbound",
      sentAt: "2024-06-15T14:00:00Z",
    })
    expect(result.sentAt).toBe("2024-06-15T14:00:00Z")
  })

  it("rejects subject over 500 chars", () => {
    expect(() =>
      insertCommunicationLogSchema.parse({
        channel: "email",
        direction: "outbound",
        subject: "x".repeat(501),
      }),
    ).toThrow()
  })
})

describe("Communication list query schema", () => {
  it("applies pagination defaults", () => {
    const result = communicationListQuerySchema.parse({})
    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
  })

  it("accepts channel filter", () => {
    const result = communicationListQuerySchema.parse({ channel: "email" })
    expect(result.channel).toBe("email")
  })

  it("accepts direction filter", () => {
    const result = communicationListQuerySchema.parse({ direction: "inbound" })
    expect(result.direction).toBe("inbound")
  })

  it("accepts date range filters", () => {
    const result = communicationListQuerySchema.parse({
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
    })
    expect(result.dateFrom).toBe("2024-01-01")
    expect(result.dateTo).toBe("2024-12-31")
  })
})

// ---------- Segments ----------

describe("Segment schemas", () => {
  it("accepts valid segment", () => {
    const result = insertSegmentSchema.parse({ name: "VIP Clients" })
    expect(result.name).toBe("VIP Clients")
  })

  it("rejects empty name", () => {
    expect(() => insertSegmentSchema.parse({ name: "" })).toThrow()
  })

  it("rejects name over 255 chars", () => {
    expect(() => insertSegmentSchema.parse({ name: "x".repeat(256) })).toThrow()
  })

  it("accepts optional description", () => {
    const result = insertSegmentSchema.parse({
      name: "VIP Clients",
      description: "Clients with annual spend > $100k",
    })
    expect(result.description).toBe("Clients with annual spend > $100k")
  })

  it("accepts optional conditions as JSON", () => {
    const result = insertSegmentSchema.parse({
      name: "Active",
      conditions: { status: "active", relation: "client" },
    })
    expect(result.conditions).toEqual({ status: "active", relation: "client" })
  })

  it("accepts null conditions", () => {
    const result = insertSegmentSchema.parse({ name: "All", conditions: null })
    expect(result.conditions).toBeNull()
  })
})

// ---------- Enum schemas ----------

describe("Enum schemas", () => {
  it("relationTypeSchema accepts valid values", () => {
    for (const value of ["client", "partner", "supplier", "other"]) {
      expect(relationTypeSchema.parse(value)).toBe(value)
    }
  })

  it("relationTypeSchema rejects invalid value", () => {
    expect(() => relationTypeSchema.parse("vendor")).toThrow()
  })

  it("communicationChannelSchema accepts valid values", () => {
    for (const value of ["email", "phone", "whatsapp", "sms", "meeting", "other"]) {
      expect(communicationChannelSchema.parse(value)).toBe(value)
    }
  })

  it("communicationChannelSchema rejects invalid value", () => {
    expect(() => communicationChannelSchema.parse("telegram")).toThrow()
  })

  it("communicationDirectionSchema accepts valid values", () => {
    for (const value of ["inbound", "outbound"]) {
      expect(communicationDirectionSchema.parse(value)).toBe(value)
    }
  })

  it("communicationDirectionSchema rejects invalid value", () => {
    expect(() => communicationDirectionSchema.parse("bidirectional")).toThrow()
  })
})

// ---------- List query schemas ----------

describe("Pagination defaults", () => {
  it("applies default limit and offset", () => {
    const result = organizationListQuerySchema.parse({})
    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
  })

  it("coerces string limit and offset", () => {
    const result = organizationListQuerySchema.parse({ limit: "25", offset: "10" })
    expect(result.limit).toBe(25)
    expect(result.offset).toBe(10)
  })

  it("rejects negative limit", () => {
    expect(() => organizationListQuerySchema.parse({ limit: -1 })).toThrow()
  })

  it("rejects limit over 200", () => {
    expect(() => organizationListQuerySchema.parse({ limit: 201 })).toThrow()
  })

  it("rejects negative offset", () => {
    expect(() => organizationListQuerySchema.parse({ offset: -1 })).toThrow()
  })

  it("works for activity list query with filters", () => {
    const result = activityListQuerySchema.parse({
      type: "call",
      status: "planned",
    })
    expect(result.type).toBe("call")
    expect(result.status).toBe("planned")
    expect(result.limit).toBe(50)
  })

  it("works for custom field definition list query", () => {
    const result = customFieldDefinitionListQuerySchema.parse({
      entityType: "organization",
    })
    expect(result.entityType).toBe("organization")
    expect(result.limit).toBe(50)
  })
})

describe("Organization list query", () => {
  it("accepts relation filter", () => {
    const result = organizationListQuerySchema.parse({ relation: "client" })
    expect(result.relation).toBe("client")
  })

  it("accepts status filter", () => {
    const result = organizationListQuerySchema.parse({ status: "archived" })
    expect(result.status).toBe("archived")
  })

  it("accepts search filter", () => {
    const result = organizationListQuerySchema.parse({ search: "acme" })
    expect(result.search).toBe("acme")
  })

  it("accepts ownerId filter", () => {
    const result = organizationListQuerySchema.parse({ ownerId: "user_123" })
    expect(result.ownerId).toBe("user_123")
  })
})

describe("Person list query", () => {
  it("accepts relation filter", () => {
    const result = personListQuerySchema.parse({ relation: "supplier" })
    expect(result.relation).toBe("supplier")
  })

  it("accepts organizationId filter", () => {
    const result = personListQuerySchema.parse({ organizationId: "org_123" })
    expect(result.organizationId).toBe("org_123")
  })

  it("accepts search filter", () => {
    const result = personListQuerySchema.parse({ search: "john" })
    expect(result.search).toBe("john")
  })

  it("accepts combined filters", () => {
    const result = personListQuerySchema.parse({
      relation: "client",
      status: "active",
      search: "doe",
      limit: 10,
    })
    expect(result.relation).toBe("client")
    expect(result.status).toBe("active")
    expect(result.search).toBe("doe")
    expect(result.limit).toBe(10)
  })
})
