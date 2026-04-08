import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const entityTypeEnum = pgEnum("entity_type", [
  "organization",
  "person",
  "opportunity",
  "quote",
  "activity",
])

export const relationTypeEnum = pgEnum("relation_type", ["client", "partner", "supplier", "other"])

export const communicationChannelEnum = pgEnum("communication_channel", [
  "email",
  "phone",
  "whatsapp",
  "sms",
  "meeting",
  "other",
])

export const communicationDirectionEnum = pgEnum("communication_direction", ["inbound", "outbound"])

export const recordStatusEnum = pgEnum("record_status", ["active", "inactive", "archived"])

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "won",
  "lost",
  "archived",
])

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "expired",
  "rejected",
  "archived",
])

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "email",
  "meeting",
  "task",
  "follow_up",
  "note",
])

export const activityStatusEnum = pgEnum("activity_status", ["planned", "done", "cancelled"])

export const activityLinkRoleEnum = pgEnum("activity_link_role", ["primary", "related"])

export const participantRoleEnum = pgEnum("participant_role", [
  "traveler",
  "booker",
  "decision_maker",
  "finance",
  "other",
])

export const customFieldTypeEnum = pgEnum("custom_field_type", [
  "varchar",
  "text",
  "double",
  "monetary",
  "date",
  "boolean",
  "enum",
  "set",
  "json",
  "address",
  "phone",
])

export const organizations = pgTable(
  "organizations",
  {
    id: typeId("organizations"),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    website: text("website"),
    industry: text("industry"),
    relation: relationTypeEnum("relation"),
    ownerId: text("owner_id"),
    defaultCurrency: text("default_currency"),
    preferredLanguage: text("preferred_language"),
    paymentTerms: integer("payment_terms"),
    status: recordStatusEnum("status").notNull().default("active"),
    source: text("source"),
    sourceRef: text("source_ref"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_organizations_name").on(table.name),
    index("idx_organizations_owner").on(table.ownerId),
    index("idx_organizations_status").on(table.status),
  ],
)

export const people = pgTable(
  "people",
  {
    id: typeId("people"),
    organizationId: typeIdRef("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    jobTitle: text("job_title"),
    relation: relationTypeEnum("relation"),
    preferredLanguage: text("preferred_language"),
    preferredCurrency: text("preferred_currency"),
    ownerId: text("owner_id"),
    status: recordStatusEnum("status").notNull().default("active"),
    source: text("source"),
    sourceRef: text("source_ref"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    birthday: date("birthday"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_people_org").on(table.organizationId),
    index("idx_people_owner").on(table.ownerId),
    index("idx_people_status").on(table.status),
    index("idx_people_name").on(table.firstName, table.lastName),
  ],
)

export const pipelines = pgTable(
  "pipelines",
  {
    id: typeId("pipelines"),
    entityType: entityTypeEnum("entity_type").notNull().default("opportunity"),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pipelines_entity").on(table.entityType),
    uniqueIndex("uidx_pipelines_entity_name").on(table.entityType, table.name),
  ],
)

export const stages = pgTable(
  "stages",
  {
    id: typeId("stages"),
    pipelineId: typeIdRef("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    probability: integer("probability"),
    isClosed: boolean("is_closed").notNull().default(false),
    isWon: boolean("is_won").notNull().default(false),
    isLost: boolean("is_lost").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stages_pipeline").on(table.pipelineId),
    uniqueIndex("uidx_stages_pipeline_name").on(table.pipelineId, table.name),
  ],
)

export const opportunities = pgTable(
  "opportunities",
  {
    id: typeId("opportunities"),
    title: text("title").notNull(),
    personId: typeIdRef("person_id").references(() => people.id, { onDelete: "set null" }),
    organizationId: typeIdRef("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    pipelineId: typeIdRef("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "restrict" }),
    stageId: typeIdRef("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "restrict" }),
    ownerId: text("owner_id"),
    status: opportunityStatusEnum("status").notNull().default("open"),
    valueAmountCents: integer("value_amount_cents"),
    valueCurrency: text("value_currency"),
    expectedCloseDate: date("expected_close_date"),
    source: text("source"),
    sourceRef: text("source_ref"),
    lostReason: text("lost_reason"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_opportunities_person").on(table.personId),
    index("idx_opportunities_org").on(table.organizationId),
    index("idx_opportunities_pipeline").on(table.pipelineId),
    index("idx_opportunities_stage").on(table.stageId),
    index("idx_opportunities_owner").on(table.ownerId),
    index("idx_opportunities_status").on(table.status),
  ],
)

export const opportunityParticipants = pgTable(
  "opportunity_participants",
  {
    id: typeId("opportunity_participants"),
    opportunityId: typeIdRef("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    personId: typeIdRef("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    role: participantRoleEnum("role").notNull().default("other"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_opportunity_participants_opportunity").on(table.opportunityId),
    index("idx_opportunity_participants_person").on(table.personId),
    uniqueIndex("uidx_opportunity_participants_unique").on(table.opportunityId, table.personId),
  ],
)

export const opportunityProducts = pgTable(
  "opportunity_products",
  {
    id: typeId("opportunity_products"),
    opportunityId: typeIdRef("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    supplierServiceId: text("supplier_service_id"),
    nameSnapshot: text("name_snapshot").notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull().default(1),
    unitPriceAmountCents: integer("unit_price_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    currency: text("currency"),
    discountAmountCents: integer("discount_amount_cents"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_opportunity_products_opportunity").on(table.opportunityId),
    index("idx_opportunity_products_product").on(table.productId),
    index("idx_opportunity_products_supplier_service").on(table.supplierServiceId),
  ],
)

export const quotes = pgTable(
  "quotes",
  {
    id: typeId("quotes"),
    opportunityId: typeIdRef("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    status: quoteStatusEnum("status").notNull().default("draft"),
    validUntil: date("valid_until"),
    currency: text("currency").notNull(),
    subtotalAmountCents: integer("subtotal_amount_cents").notNull().default(0),
    taxAmountCents: integer("tax_amount_cents").notNull().default(0),
    totalAmountCents: integer("total_amount_cents").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_quotes_opportunity").on(table.opportunityId),
    index("idx_quotes_status").on(table.status),
  ],
)

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: typeId("quote_lines"),
    quoteId: typeIdRef("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    supplierServiceId: text("supplier_service_id"),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceAmountCents: integer("unit_price_amount_cents").notNull().default(0),
    totalAmountCents: integer("total_amount_cents").notNull().default(0),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_quote_lines_quote").on(table.quoteId),
    index("idx_quote_lines_product").on(table.productId),
    index("idx_quote_lines_supplier_service").on(table.supplierServiceId),
  ],
)

export const activities = pgTable(
  "activities",
  {
    id: typeId("activities"),
    subject: text("subject").notNull(),
    type: activityTypeEnum("type").notNull(),
    ownerId: text("owner_id"),
    status: activityStatusEnum("status").notNull().default("planned"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    location: text("location"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_activities_owner").on(table.ownerId),
    index("idx_activities_status").on(table.status),
    index("idx_activities_type").on(table.type),
  ],
)

export const activityLinks = pgTable(
  "activity_links",
  {
    id: typeId("activity_links"),
    activityId: typeIdRef("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    role: activityLinkRoleEnum("role").notNull().default("related"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_activity_links_activity").on(table.activityId),
    index("idx_activity_links_entity").on(table.entityType, table.entityId),
  ],
)

export const activityParticipants = pgTable(
  "activity_participants",
  {
    id: typeId("activity_participants"),
    activityId: typeIdRef("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    personId: typeIdRef("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_activity_participants_activity").on(table.activityId),
    uniqueIndex("uidx_activity_participants_unique").on(table.activityId, table.personId),
  ],
)

export const customFieldDefinitions = pgTable(
  "custom_field_definitions",
  {
    id: typeId("custom_field_definitions"),
    entityType: entityTypeEnum("entity_type").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    fieldType: customFieldTypeEnum("field_type").notNull(),
    isRequired: boolean("is_required").notNull().default(false),
    isSearchable: boolean("is_searchable").notNull().default(false),
    options: jsonb("options").$type<Array<{ label: string; value: string }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_custom_field_definitions_entity").on(table.entityType),
    uniqueIndex("uidx_custom_field_definitions_key").on(table.entityType, table.key),
  ],
)

export const customFieldValues = pgTable(
  "custom_field_values",
  {
    id: typeId("custom_field_values"),
    definitionId: typeIdRef("definition_id")
      .notNull()
      .references(() => customFieldDefinitions.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    textValue: text("text_value"),
    numberValue: integer("number_value"),
    dateValue: date("date_value"),
    booleanValue: boolean("boolean_value"),
    monetaryValueCents: integer("monetary_value_cents"),
    currencyCode: text("currency_code"),
    jsonValue: jsonb("json_value").$type<Record<string, unknown> | string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_custom_field_values_entity").on(table.entityType, table.entityId),
    uniqueIndex("uidx_custom_field_values_unique").on(
      table.definitionId,
      table.entityType,
      table.entityId,
    ),
  ],
)

// ---------- person_notes ----------

export const personNotes = pgTable(
  "person_notes",
  {
    id: typeId("person_notes"),
    personId: typeIdRef("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_person_notes_person").on(table.personId)],
)

export type PersonNote = typeof personNotes.$inferSelect
export type NewPersonNote = typeof personNotes.$inferInsert

// ---------- organization_notes ----------

export const organizationNotes = pgTable(
  "organization_notes",
  {
    id: typeId("organization_notes"),
    organizationId: typeIdRef("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_organization_notes_org").on(table.organizationId)],
)

export type OrganizationNote = typeof organizationNotes.$inferSelect
export type NewOrganizationNote = typeof organizationNotes.$inferInsert

// ---------- communication_log ----------

export const communicationLog = pgTable(
  "communication_log",
  {
    id: typeId("communication_log"),
    personId: typeIdRef("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    organizationId: typeIdRef("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    channel: communicationChannelEnum("channel").notNull(),
    direction: communicationDirectionEnum("direction").notNull(),
    subject: text("subject"),
    content: text("content"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_communication_log_person").on(table.personId),
    index("idx_communication_log_org").on(table.organizationId),
    index("idx_communication_log_channel").on(table.channel),
  ],
)

export type CommunicationLogEntry = typeof communicationLog.$inferSelect
export type NewCommunicationLogEntry = typeof communicationLog.$inferInsert

// ---------- segments ----------

export const segments = pgTable("segments", {
  id: typeId("segments"),
  name: text("name").notNull(),
  description: text("description"),
  conditions: jsonb("conditions").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Segment = typeof segments.$inferSelect
export type NewSegment = typeof segments.$inferInsert

// ---------- segment_members ----------

export const segmentMembers = pgTable(
  "segment_members",
  {
    id: typeId("segment_members"),
    segmentId: typeIdRef("segment_id")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
    personId: typeIdRef("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_segment_members_segment").on(table.segmentId),
    index("idx_segment_members_person").on(table.personId),
  ],
)

export type SegmentMember = typeof segmentMembers.$inferSelect
export type NewSegmentMember = typeof segmentMembers.$inferInsert

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type Person = typeof people.$inferSelect
export type NewPerson = typeof people.$inferInsert
export type Pipeline = typeof pipelines.$inferSelect
export type NewPipeline = typeof pipelines.$inferInsert
export type Stage = typeof stages.$inferSelect
export type NewStage = typeof stages.$inferInsert
export type Opportunity = typeof opportunities.$inferSelect
export type NewOpportunity = typeof opportunities.$inferInsert
export type OpportunityParticipant = typeof opportunityParticipants.$inferSelect
export type NewOpportunityParticipant = typeof opportunityParticipants.$inferInsert
export type OpportunityProduct = typeof opportunityProducts.$inferSelect
export type NewOpportunityProduct = typeof opportunityProducts.$inferInsert
export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
export type QuoteLine = typeof quoteLines.$inferSelect
export type NewQuoteLine = typeof quoteLines.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type ActivityLink = typeof activityLinks.$inferSelect
export type NewActivityLink = typeof activityLinks.$inferInsert
export type ActivityParticipant = typeof activityParticipants.$inferSelect
export type NewActivityParticipant = typeof activityParticipants.$inferInsert
export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect
export type NewCustomFieldDefinition = typeof customFieldDefinitions.$inferInsert
export type CustomFieldValue = typeof customFieldValues.$inferSelect
export type NewCustomFieldValue = typeof customFieldValues.$inferInsert

export const organizationsRelations = relations(organizations, ({ many }) => ({
  people: many(people),
  opportunities: many(opportunities),
  notes: many(organizationNotes),
  communications: many(communicationLog),
}))

export const peopleRelations = relations(people, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [people.organizationId],
    references: [organizations.id],
  }),
  opportunities: many(opportunities),
  activityParticipants: many(activityParticipants),
  opportunityParticipants: many(opportunityParticipants),
  notes: many(personNotes),
  communications: many(communicationLog),
  segmentMemberships: many(segmentMembers),
}))

export const pipelinesRelations = relations(pipelines, ({ many }) => ({
  stages: many(stages),
  opportunities: many(opportunities),
}))

export const stagesRelations = relations(stages, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [stages.pipelineId], references: [pipelines.id] }),
  opportunities: many(opportunities),
}))

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  person: one(people, { fields: [opportunities.personId], references: [people.id] }),
  organization: one(organizations, {
    fields: [opportunities.organizationId],
    references: [organizations.id],
  }),
  pipeline: one(pipelines, {
    fields: [opportunities.pipelineId],
    references: [pipelines.id],
  }),
  stage: one(stages, { fields: [opportunities.stageId], references: [stages.id] }),
  participants: many(opportunityParticipants),
  products: many(opportunityProducts),
  quotes: many(quotes),
}))

export const opportunityParticipantsRelations = relations(opportunityParticipants, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityParticipants.opportunityId],
    references: [opportunities.id],
  }),
  person: one(people, {
    fields: [opportunityParticipants.personId],
    references: [people.id],
  }),
}))

export const opportunityProductsRelations = relations(opportunityProducts, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityProducts.opportunityId],
    references: [opportunities.id],
  }),
}))

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  opportunity: one(opportunities, {
    fields: [quotes.opportunityId],
    references: [opportunities.id],
  }),
  lines: many(quoteLines),
}))

export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, { fields: [quoteLines.quoteId], references: [quotes.id] }),
}))

export const activitiesRelations = relations(activities, ({ many }) => ({
  links: many(activityLinks),
  participants: many(activityParticipants),
}))

export const activityLinksRelations = relations(activityLinks, ({ one }) => ({
  activity: one(activities, {
    fields: [activityLinks.activityId],
    references: [activities.id],
  }),
}))

export const activityParticipantsRelations = relations(activityParticipants, ({ one }) => ({
  activity: one(activities, {
    fields: [activityParticipants.activityId],
    references: [activities.id],
  }),
  person: one(people, {
    fields: [activityParticipants.personId],
    references: [people.id],
  }),
}))

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ many }) => ({
  values: many(customFieldValues),
}))

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  definition: one(customFieldDefinitions, {
    fields: [customFieldValues.definitionId],
    references: [customFieldDefinitions.id],
  }),
}))

export const personNotesRelations = relations(personNotes, ({ one }) => ({
  person: one(people, { fields: [personNotes.personId], references: [people.id] }),
}))

export const organizationNotesRelations = relations(organizationNotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationNotes.organizationId],
    references: [organizations.id],
  }),
}))

export const communicationLogRelations = relations(communicationLog, ({ one }) => ({
  person: one(people, { fields: [communicationLog.personId], references: [people.id] }),
  organization: one(organizations, {
    fields: [communicationLog.organizationId],
    references: [organizations.id],
  }),
}))

export const segmentsRelations = relations(segments, ({ many }) => ({
  members: many(segmentMembers),
}))

export const segmentMembersRelations = relations(segmentMembers, ({ one }) => ({
  segment: one(segments, { fields: [segmentMembers.segmentId], references: [segments.id] }),
  person: one(people, { fields: [segmentMembers.personId], references: [people.id] }),
}))
