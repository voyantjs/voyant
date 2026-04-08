import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { crmRoutes } from "./routes/index.js"
import { crmService } from "./service/index.js"

export type { CrmRoutes } from "./routes/index.js"

export const personLinkable: LinkableDefinition = {
  module: "crm",
  entity: "person",
  table: "people",
  idPrefix: "prsn",
}

export const organizationLinkable: LinkableDefinition = {
  module: "crm",
  entity: "organization",
  table: "organizations",
  idPrefix: "orgn",
}

export const crmModule: Module = {
  name: "crm",
  linkable: {
    person: personLinkable,
    organization: organizationLinkable,
  },
}

export const crmHonoModule: HonoModule = {
  module: crmModule,
  routes: crmRoutes,
}

export type {
  Activity,
  ActivityLink,
  ActivityParticipant,
  CommunicationLogEntry,
  CustomFieldDefinition,
  CustomFieldValue,
  NewActivity,
  NewActivityLink,
  NewActivityParticipant,
  NewCommunicationLogEntry,
  NewCustomFieldDefinition,
  NewCustomFieldValue,
  NewOpportunity,
  NewOpportunityParticipant,
  NewOpportunityProduct,
  NewOrganization,
  NewOrganizationNote,
  NewPerson,
  NewPersonNote,
  NewPipeline,
  NewQuote,
  NewQuoteLine,
  NewSegment,
  NewSegmentMember,
  NewStage,
  Opportunity,
  OpportunityParticipant,
  OpportunityProduct,
  Organization,
  OrganizationNote,
  Person,
  PersonNote,
  Pipeline,
  Quote,
  QuoteLine,
  Segment,
  SegmentMember,
  Stage,
} from "./schema.js"
export {
  activities,
  activityLinks,
  activityParticipants,
  communicationLog,
  customFieldDefinitions,
  customFieldValues,
  opportunities,
  opportunityParticipants,
  opportunityProducts,
  organizationNotes,
  organizations,
  people,
  personNotes,
  pipelines,
  quoteLines,
  quotes,
  segmentMembers,
  segments,
  stages,
} from "./schema.js"
export {
  activityListQuerySchema,
  communicationChannelSchema,
  communicationDirectionSchema,
  communicationListQuerySchema,
  customFieldDefinitionListQuerySchema,
  customFieldValueListQuerySchema,
  insertActivityLinkSchema,
  insertActivityParticipantSchema,
  insertActivitySchema,
  insertCommunicationLogSchema,
  insertCustomFieldDefinitionSchema,
  insertOpportunityParticipantSchema,
  insertOpportunityProductSchema,
  insertOpportunitySchema,
  insertOrganizationNoteSchema,
  insertOrganizationSchema,
  insertPersonNoteSchema,
  insertPersonSchema,
  insertPipelineSchema,
  insertQuoteLineSchema,
  insertQuoteSchema,
  insertSegmentSchema,
  insertStageSchema,
  opportunityListQuerySchema,
  organizationListQuerySchema,
  personListQuerySchema,
  pipelineListQuerySchema,
  quoteListQuerySchema,
  relationTypeSchema,
  stageListQuerySchema,
  updateActivitySchema,
  updateCustomFieldDefinitionSchema,
  updateOpportunityProductSchema,
  updateOpportunitySchema,
  updateOrganizationSchema,
  updatePersonSchema,
  updatePipelineSchema,
  updateQuoteLineSchema,
  updateQuoteSchema,
  updateStageSchema,
  upsertCustomFieldValueSchema,
} from "./validation.js"
export { crmService }
export { crmBookingExtension } from "./booking-extension.js"
