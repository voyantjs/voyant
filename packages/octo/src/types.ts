export type OctoAvailabilityType = "START_TIME" | "OPENING_HOURS"

export type OctoUnitType =
  | "ADULT"
  | "CHILD"
  | "YOUTH"
  | "INFANT"
  | "FAMILY"
  | "SENIOR"
  | "STUDENT"
  | "MILITARY"
  | "OTHER"

export type OctoAvailabilityStatus = "AVAILABLE" | "FREESALE" | "SOLD_OUT" | "LIMITED" | "CLOSED"

export type OctoBookingStatus = "ON_HOLD" | "CONFIRMED" | "EXPIRED" | "CANCELLED"

export interface OctoProjectedUnitRestrictions {
  minAge?: number
  maxAge?: number
  minQuantity?: number
  maxQuantity?: number
  occupancyMin?: number
  occupancyMax?: number
}

export interface OctoProjectedUnit {
  id: string
  name: string
  code: string | null
  type: OctoUnitType
  restrictions: OctoProjectedUnitRestrictions
}

export interface OctoProjectedOption {
  id: string
  name: string
  code: string | null
  default: boolean
  availabilityLocalStartTimes: string[]
  units: OctoProjectedUnit[]
}

export interface OctoProjectedProductContent {
  highlights: Array<{ id: string; title: string; description: string | null }>
  inclusions: Array<{ id: string; title: string; description: string | null }>
  exclusions: Array<{ id: string; title: string; description: string | null }>
  importantInformation: Array<{ id: string; title: string; description: string | null }>
  faqs: Array<{ id: string; question: string; answer: string }>
  locations: Array<{
    id: string
    type: string
    title: string
    address: string | null
    city: string | null
    countryCode: string | null
    latitude: number | null
    longitude: number | null
    googlePlaceId: string | null
    applePlaceId: string | null
    tripadvisorLocationId: string | null
  }>
}

export interface OctoProjectedProduct {
  id: string
  name: string
  description: string | null
  timeZone: string | null
  availabilityType: OctoAvailabilityType
  allowFreesale: boolean
  instantConfirmation: boolean
  options: OctoProjectedOption[]
  content: OctoProjectedProductContent
  extensions: {
    status: string
    visibility: string
    activated: boolean
    facilityId: string | null
    bookingMode: string
    capabilityCodes: string[]
    deliveryFormats: string[]
  }
}

export interface OctoProjectedAvailability {
  id: string
  productId: string
  optionId: string | null
  localDateTimeStart: string
  localDateTimeEnd: string | null
  timeZone: string
  status: OctoAvailabilityStatus
  vacancies: number | null
  capacity: number | null
}

export interface OctoProjectedBookingContact {
  travelerId: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  language: string | null
}

export interface OctoProjectedBookingUnitItem {
  bookingItemId: string
  title: string
  itemType: string
  status: string
  quantity: number
  productId: string | null
  optionId: string | null
  unitId: string | null
  pricingCategoryId: string | null
  availabilityId: string | null
  travelerIds: string[]
}

export interface OctoProjectedBookingFulfillment {
  id: string
  bookingItemId: string | null
  travelerId: string | null
  type: string
  deliveryChannel: string
  status: string
  artifactUrl: string | null
  payload: Record<string, unknown> | null
  issuedAt: string | null
  revokedAt: string | null
}

export interface OctoProjectedBookingArtifact {
  fulfillmentId: string
  bookingItemId: string | null
  travelerId: string | null
  type: string
  deliveryChannel: string
  status: string
  artifactUrl: string | null
  downloadUrl: string | null
  pdfUrl: string | null
  qrCode: string | null
  barcode: string | null
  voucherCode: string | null
  issuedAt: string | null
  revokedAt: string | null
}

export interface OctoProjectedBookingSupplierReference {
  id: string
  supplierServiceId: string | null
  serviceName: string
  status: string
  supplierReference: string | null
  confirmedAt: string | null
}

export interface OctoProjectedBookingRedemptionEvent {
  id: string
  bookingItemId: string | null
  travelerId: string | null
  redeemedAt: string
  redeemedBy: string | null
  location: string | null
  method: string
  metadata: Record<string, unknown> | null
}

export interface OctoProjectedBookingReferences {
  resellerReference: string | null
  offerId: string | null
  offerNumber: string | null
  orderId: string | null
  orderNumber: string | null
  supplierReferences: OctoProjectedBookingSupplierReference[]
}

export interface OctoProjectedBooking {
  id: string
  bookingNumber: string
  status: OctoBookingStatus
  availabilityId: string | null
  contact: OctoProjectedBookingContact | null
  unitItems: OctoProjectedBookingUnitItem[]
  fulfillments: OctoProjectedBookingFulfillment[]
  artifacts: OctoProjectedBookingArtifact[]
  redemptions: OctoProjectedBookingRedemptionEvent[]
  references: OctoProjectedBookingReferences
  holdExpiresAt: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  expiredAt: string | null
  utcRedeemedAt: string | null
  extensions: {
    sourceType: string
    externalBookingRef: string | null
    communicationLanguage: string | null
    personId: string | null
    organizationId: string | null
    sellCurrency: string
    baseCurrency: string | null
  }
}
