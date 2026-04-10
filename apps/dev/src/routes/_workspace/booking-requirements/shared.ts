import { api } from "@/lib/api-client"
import { getApiListQueryOptions, type ListResponse } from "../_lib/api-query-options"
import type { BookingQuestionData } from "./_components/booking-question-dialog"
import type { BookingQuestionOptionData } from "./_components/question-option-dialog"

export type ProductLite = { id: string; name: string; code: string | null; status: string }

export const SELECT_TYPES = new Set(["single_select", "multi_select"])

export function getBookingRequirementProductsQueryOptions() {
  return getApiListQueryOptions<ProductLite>(
    ["booking-requirements", "products"],
    "/v1/products?limit=200",
  )
}

export function getBookingQuestions(productId: string) {
  return api.get<ListResponse<BookingQuestionData>>(
    `/v1/booking-requirements/questions?productId=${productId}&limit=200`,
  )
}

export function getQuestionOptions(questionId: string) {
  return api.get<ListResponse<BookingQuestionOptionData>>(
    `/v1/booking-requirements/question-options?productBookingQuestionId=${questionId}&limit=100`,
  )
}
