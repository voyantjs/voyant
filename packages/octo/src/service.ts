import {
  cancelProjectedBooking,
  confirmProjectedBooking,
  expireProjectedBooking,
  extendProjectedBookingHold,
  getProjectedBookingById,
  listProjectedBookings,
  listProjectedRedemptions,
  recordProjectedRedemption,
  reserveProjectedBooking,
} from "./service-bookings.js"
import {
  getProjectedAvailabilityById,
  getProjectedAvailabilityCalendar,
  getProjectedProductById,
  listProjectedAvailability,
  listProjectedProducts,
} from "./service-products.js"
import {
  deriveOctoAvailabilityStatus,
  inferOctoAvailabilityType,
  inferOctoUnitType,
  mapBookingArtifact,
  mapBookingStatus,
} from "./service-shared.js"

export {
  deriveOctoAvailabilityStatus,
  inferOctoAvailabilityType,
  inferOctoUnitType,
  mapBookingArtifact,
  mapBookingStatus,
}

export const octoService = {
  getProjectedProductById,
  getProjectedAvailabilityById,
  listProjectedAvailability,
  getProjectedAvailabilityCalendar,
  listProjectedProducts,
  getProjectedBookingById,
  listProjectedBookings,
  reserveProjectedBooking,
  confirmProjectedBooking,
  extendProjectedBookingHold,
  expireProjectedBooking,
  cancelProjectedBooking,
  listProjectedRedemptions,
  recordProjectedRedemption,
}
