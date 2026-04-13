import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

interface ExportCheck {
  packageName: string
  entry: string
  requiredExports: string[]
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const checks: ExportCheck[] = [
  {
    packageName: "@voyantjs/finance",
    entry: "packages/finance/dist/index.js",
    requiredExports: [
      "publicFinanceRoutes",
      "publicFinanceService",
      "publicBookingFinanceDocumentsSchema",
      "publicFinanceBookingDocumentSchema",
      "publicFinanceDocumentAvailabilitySchema",
      "publicBookingPaymentOptionsSchema",
      "publicPaymentOptionsQuerySchema",
      "publicPaymentSessionSchema",
      "publicStartPaymentSessionSchema",
      "publicValidateVoucherSchema",
      "publicVoucherValidationSchema",
    ],
  },
  {
    packageName: "@voyantjs/finance-react",
    entry: "packages/finance-react/dist/index.js",
    requiredExports: [
      "getPublicBookingDocuments",
      "getPublicBookingDocumentsQueryOptions",
      "usePublicBookingDocuments",
      "publicBookingFinanceDocumentsSchema",
      "publicFinanceBookingDocumentSchema",
      "getPublicBookingPaymentOptions",
      "getPublicBookingPaymentOptionsQueryOptions",
      "getPublicPaymentSession",
      "getPublicPaymentSessionQueryOptions",
      "startPublicBookingGuaranteePaymentSession",
      "startPublicBookingSchedulePaymentSession",
      "validatePublicVoucher",
      "publicBookingPaymentOptionsSchema",
      "publicPaymentOptionsQuerySchema",
      "publicPaymentSessionSchema",
      "publicStartPaymentSessionSchema",
      "publicValidateVoucherSchema",
      "publicVoucherValidationSchema",
    ],
  },
  {
    packageName: "@voyantjs/products",
    entry: "packages/products/dist/index.js",
    requiredExports: ["publicProductRoutes", "publicProductsService"],
  },
  {
    packageName: "@voyantjs/bookings",
    entry: "packages/bookings/dist/index.js",
    requiredExports: [
      "publicBookingRoutes",
      "publicBookingsService",
      "publicBookingOverviewLookupQuerySchema",
      "publicBookingSessionRepriceResultSchema",
      "publicBookingSessionStateSchema",
      "publicBookingSessionMutationSchema",
      "publicCreateBookingSessionSchema",
      "publicRepriceBookingSessionSchema",
      "publicUpsertBookingSessionStateSchema",
      "publicUpdateBookingSessionSchema",
      "bookingSessionStates",
    ],
  },
  {
    packageName: "@voyantjs/bookings-react",
    entry: "packages/bookings-react/dist/index.js",
    requiredExports: [
      "usePublicBookingSession",
      "usePublicBookingSessionState",
      "usePublicBookingSessionFlowMutation",
      "getPublicBookingSessionQueryOptions",
      "getPublicBookingSessionStateQueryOptions",
      "publicBookingSessionResponse",
      "publicBookingSessionStateResponse",
      "publicBookingSessionRepriceResponse",
    ],
  },
  {
    packageName: "@voyantjs/products-react",
    entry: "packages/products-react/dist/index.js",
    requiredExports: [
      "useProductDayMutation",
      "useProductDays",
      "useProductMedia",
      "useProductMediaMutation",
      "useProductVersionMutation",
      "useProductVersions",
      "getProductDayServicesQueryOptions",
      "getProductDaysQueryOptions",
      "getProductMediaQueryOptions",
      "getProductVersionsQueryOptions",
      "productDayRecordSchema",
      "productMediaRecordSchema",
      "productVersionRecordSchema",
    ],
  },
  {
    packageName: "@voyantjs/storefront",
    entry: "packages/storefront/dist/index.js",
    requiredExports: [
      "createStorefrontHonoModule",
      "createStorefrontPublicRoutes",
      "createStorefrontService",
      "resolveStorefrontSettings",
      "storefrontSettingsInputSchema",
      "storefrontSettingsSchema",
    ],
  },
  {
    packageName: "@voyantjs/notifications",
    entry: "packages/notifications/dist/index.js",
    requiredExports: [
      "createResendProvider",
      "createResendProviderFromEnv",
      "createTwilioProvider",
      "createTwilioProviderFromEnv",
      "createDefaultNotificationProviders",
    ],
  },
  {
    packageName: "@voyantjs/storefront-verification",
    entry: "packages/storefront-verification/dist/index.js",
    requiredExports: [
      "createStorefrontVerificationHonoModule",
      "createStorefrontVerificationPublicRoutes",
      "createStorefrontVerificationService",
      "createStorefrontVerificationSendersFromProviders",
      "storefrontVerificationChallenges",
      "startEmailVerificationChallengeSchema",
      "confirmSmsVerificationChallengeSchema",
    ],
  },
  {
    packageName: "@voyantjs/checkout",
    entry: "packages/checkout/dist/index.js",
    requiredExports: [
      "createCheckoutRoutes",
      "createCheckoutAdminRoutes",
      "createCheckoutHonoModule",
      "checkoutModule",
      "checkoutCollectionPlanSchema",
      "initiatedCheckoutCollectionSchema",
      "checkoutReminderRunListResponseSchema",
      "listBookingReminderRuns",
    ],
  },
  {
    packageName: "@voyantjs/booking-requirements",
    entry: "packages/booking-requirements/dist/index.js",
    requiredExports: [
      "publicBookingRequirementsRoutes",
      "bookingRequirementsService",
      "publicTransportRequirementsQuerySchema",
      "publicTransportRequirementsSchema",
      "transportRequirementFieldSchema",
    ],
  },
  {
    packageName: "@voyantjs/booking-requirements-react",
    entry: "packages/booking-requirements-react/dist/index.js",
    requiredExports: [
      "useTransportRequirements",
      "getTransportRequirementsQueryOptions",
      "bookingRequirementsQueryKeys",
      "publicTransportRequirementsSchema",
      "transportRequirementFieldSchema",
    ],
  },
]

async function main() {
  const failures: string[] = []

  for (const check of checks) {
    const entryPath = path.join(repoRoot, check.entry)
    if (!existsSync(entryPath)) {
      failures.push(
        `${check.packageName}: missing build output at ${check.entry}; run the package build before verifying exports.`,
      )
      continue
    }

    try {
      const mod = await import(pathToFileURL(entryPath).href)
      const missingExports = check.requiredExports.filter((name) => !(name in mod))

      if (missingExports.length > 0) {
        failures.push(`${check.packageName}: missing exports ${missingExports.join(", ")}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${check.packageName}: failed to import built entrypoint (${message})`)
    }
  }

  if (failures.length > 0) {
    console.error("Package export verification failed:\n")
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`Verified runtime package exports for ${checks.length} package entrypoints.`)
}

void main()
