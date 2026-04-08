// Collection tables
export {
  collectionCoreColumns,
  collectionItemsCoreColumns,
  collectionTranslationsCoreColumns,
} from "./collection"
// Cruise tables
export { shipCabinCategoryCoreColumns, shipCabinCoreColumns } from "./cruise"
export { departureCoreColumns } from "./departure"
// Departure sub-tables
export {
  departureCabinCategoriesCoreColumns,
  departureCabinsCoreColumns,
  departureDaysCoreColumns,
  departureDayTasksCoreColumns,
  departureGroupMembersCoreColumns,
  departureGroupsCoreColumns,
  departureOverridesCoreColumns,
  departurePortCallsCoreColumns,
  departureRoomPricesCoreColumns,
  departureRoomsCoreColumns,
  departureTranslationsCoreColumns,
  departureTransportOptionsCoreColumns,
  departureTransportSeatingCoreColumns,
  departureTransportSegmentsCoreColumns,
} from "./departure-sub-tables"
// Destinations tables
export { destinationsCoreColumns } from "./destinations"
export { itineraryCoreColumns } from "./itinerary"
// Itinerary sub-tables
export {
  itineraryDaysCoreColumns,
  itineraryDayTranslationsCoreColumns,
  itinerarySegmentsCoreColumns,
  itinerarySegmentTranslationsCoreColumns,
  itineraryTranslationsCoreColumns,
  itineraryVersionsCoreColumns,
} from "./itinerary-sub-tables"
// Lodging tables
export {
  lodgingPropertyCoreColumns,
  lodgingPropertyDailyRateCoreColumns,
  lodgingPropertyMediaCoreColumns,
  lodgingPropertyRoomMediaCoreColumns,
  lodgingPropertyRoomRatePlanCoreColumns,
  lodgingPropertyRoomsCoreColumns,
  lodgingPropertyRoomTranslationCoreColumns,
  lodgingPropertyTranslationCoreColumns,
  lodgingRatePlansCoreColumns,
  lodgingRatePlanTranslationCoreColumns,
} from "./lodging"
// Offers tables
export { offerCoreColumns } from "./offers"
// Pricing tables
export {
  priceSchedulesCoreColumns,
  productBasePricesCoreColumns,
  productDeparturePriceOverridesCoreColumns,
  productPaymentOverridesCoreColumns,
  ratePlansCoreColumns,
} from "./pricing"
export { productCoreColumns, timestampColumns } from "./product"
// Product accommodation
export {
  productAccommodationOptionRoomsCoreColumns,
  productAccommodationOptionsCoreColumns,
  productAccommodationSetItemsCoreColumns,
  productAccommodationSetsCoreColumns,
} from "./product-accommodation"
// Product addons
export { productAddonsCoreColumns } from "./product-addons"
// Product availability
export { productAvailabilityCoreColumns } from "./product-availability"
// Product availability states
export {
  availabilitySessionsCoreColumns,
  blackoutDatesCoreColumns,
  departureAvailabilityStatesCoreColumns,
  productAvailabilityConfigCoreColumns,
} from "./product-availability-states"
// Product booking rules
export { productBookingRulesCoreColumns } from "./product-booking-rules"
// Product category assignments
export { productCategoryAssignmentsCoreColumns } from "./product-category-assignments"
// Product extensions
export { productExtensionsCoreColumns } from "./product-extensions"
// Product media
export { productMediaCoreColumns } from "./product-media"
// Product overrides
export { productOverridesCoreColumns } from "./product-overrides"
// Product preferences
export { productPreferencesCoreColumns } from "./product-preferences"
// Product publish settings
export { productPublishSettingsCoreColumns } from "./product-publish-settings"
// Product rate plans
export {
  productRatePlanChannelsCoreColumns,
  productRatePlansCoreColumns,
} from "./product-rate-plans"
// Product translations
export { productTranslationsCoreColumns } from "./product-translations"
// Product versions
export { productVersionsCoreColumns } from "./product-versions"
// Product visibility
export { productVisibilityCoreColumns } from "./product-visibility"
// Room tables
export {
  productRoomAvailabilityCoreColumns,
  productRoomListingMediaCoreColumns,
  productRoomListingsCoreColumns,
  productRoomSpecRatePlansCoreColumns,
  productRoomSpecsCoreColumns,
  roomPricesCoreColumns,
} from "./room"
export { shipCoreColumns } from "./ship"
// Tags tables
export { entityTagColumns, tagsCoreColumns } from "./tags"
// Transport tables
export {
  transportAddonsCoreColumns,
  transportConfigLegsCoreColumns,
  transportConfigsCoreColumns,
  transportFareClassesCoreColumns,
} from "./transport"
