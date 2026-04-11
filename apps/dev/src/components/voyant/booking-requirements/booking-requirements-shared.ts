import {
  type BookingQuestion,
  type BookingQuestionOption,
  CONTACT_FIELDS,
  CONTACT_SCOPES,
  type ContactRequirement,
  defaultFetcher,
  getBookingQuestionsQueryOptions as getBookingQuestionsQueryOptionsBase,
  getContactRequirementsQueryOptions as getContactRequirementsQueryOptionsBase,
  getProductsQueryOptions as getProductsQueryOptionsBase,
  getQuestionOptionsQueryOptions as getQuestionOptionsQueryOptionsBase,
  type ProductLite,
  QUESTION_FIELD_TYPES,
  QUESTION_TARGETS,
  SELECT_TYPES,
} from "@voyantjs/booking-requirements-react"

const client = { baseUrl: "", fetcher: defaultFetcher }

export { CONTACT_FIELDS, CONTACT_SCOPES, QUESTION_FIELD_TYPES, QUESTION_TARGETS, SELECT_TYPES }

export type BookingQuestionData = BookingQuestion
export type BookingQuestionOptionData = BookingQuestionOption
export type ContactRequirementData = ContactRequirement
export type { ProductLite }

export function getBookingRequirementProductsQueryOptions() {
  return getProductsQueryOptionsBase(client, { limit: 25, offset: 0 })
}

export function getBookingQuestionsQueryOptions(productId: string) {
  return getBookingQuestionsQueryOptionsBase(client, { productId, limit: 25, offset: 0 })
}

export function getContactRequirementsQueryOptions(productId: string) {
  return getContactRequirementsQueryOptionsBase(client, { productId, limit: 25, offset: 0 })
}

export function getQuestionOptionsQueryOptions(questionId: string) {
  return getQuestionOptionsQueryOptionsBase(client, {
    productBookingQuestionId: questionId,
    limit: 100,
  })
}
