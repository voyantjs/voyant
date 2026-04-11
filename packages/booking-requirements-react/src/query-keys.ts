export interface PaginationFilters {
  limit?: number | undefined
  offset?: number | undefined
}

export interface ProductsListFilters extends PaginationFilters {}

export interface ContactRequirementsListFilters extends PaginationFilters {
  productId?: string | undefined
}

export interface BookingQuestionsListFilters extends PaginationFilters {
  productId?: string | undefined
}

export interface BookingQuestionOptionsListFilters extends PaginationFilters {
  productBookingQuestionId?: string | undefined
}

export const bookingRequirementsQueryKeys = {
  all: ["voyant", "booking-requirements"] as const,

  products: () => [...bookingRequirementsQueryKeys.all, "products"] as const,
  productsList: (filters: ProductsListFilters) =>
    [...bookingRequirementsQueryKeys.products(), "list", filters] as const,

  contactRequirements: () => [...bookingRequirementsQueryKeys.all, "contact-requirements"] as const,
  contactRequirementsList: (filters: ContactRequirementsListFilters) =>
    [...bookingRequirementsQueryKeys.contactRequirements(), "list", filters] as const,

  questions: () => [...bookingRequirementsQueryKeys.all, "questions"] as const,
  questionsList: (filters: BookingQuestionsListFilters) =>
    [...bookingRequirementsQueryKeys.questions(), "list", filters] as const,

  questionOptions: () => [...bookingRequirementsQueryKeys.all, "question-options"] as const,
  questionOptionsList: (filters: BookingQuestionOptionsListFilters) =>
    [...bookingRequirementsQueryKeys.questionOptions(), "list", filters] as const,
} as const
