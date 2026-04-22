import {
  adminAuthMessages,
  adminAvailabilityMessages,
  adminBookingsMessages,
  adminChromeMessages,
  adminContactsMessages,
  adminDmcDistributionMessages,
  adminDmcProductsMessages,
  adminFinanceMessages,
  adminOrganizationsModuleMessages,
  adminResourcesMessages,
  adminSuppliersModuleMessages,
  adminTeamMessages,
  dmcAdminCoreMessages,
  dmcAdminMessageDefinitions,
  dmcAdminNavMessages,
  operatorAdminCoreMessages,
  operatorAdminCrmMessages,
  operatorAdminDashboardMessages,
  operatorAdminMessageDefinitions,
  operatorAdminNavMessages,
  operatorAdminPricingMessages,
  operatorAdminProductsMessages,
  operatorAdminSettingsMessages,
  operatorAdminSuppliersMessages,
} from "../packages/i18n/src/index.ts"

type LocaleDefinitions = Partial<Record<string, unknown>>

const definitions: Array<[string, LocaleDefinitions]> = [
  ["adminAuthMessages", adminAuthMessages],
  ["adminAvailabilityMessages", adminAvailabilityMessages],
  ["adminBookingsMessages", adminBookingsMessages],
  ["adminChromeMessages", adminChromeMessages],
  ["adminContactsMessages", adminContactsMessages],
  ["dmcAdminCoreMessages", dmcAdminCoreMessages],
  ["dmcAdminMessageDefinitions", dmcAdminMessageDefinitions],
  ["adminDmcDistributionMessages", adminDmcDistributionMessages],
  ["adminDmcProductsMessages", adminDmcProductsMessages],
  ["dmcAdminNavMessages", dmcAdminNavMessages],
  ["adminFinanceMessages", adminFinanceMessages],
  ["adminOrganizationsModuleMessages", adminOrganizationsModuleMessages],
  ["operatorAdminCoreMessages", operatorAdminCoreMessages],
  ["operatorAdminCrmMessages", operatorAdminCrmMessages],
  ["operatorAdminDashboardMessages", operatorAdminDashboardMessages],
  ["operatorAdminMessageDefinitions", operatorAdminMessageDefinitions],
  ["operatorAdminNavMessages", operatorAdminNavMessages],
  ["operatorAdminPricingMessages", operatorAdminPricingMessages],
  ["operatorAdminProductsMessages", operatorAdminProductsMessages],
  ["adminResourcesMessages", adminResourcesMessages],
  ["operatorAdminSettingsMessages", operatorAdminSettingsMessages],
  ["adminSuppliersModuleMessages", adminSuppliersModuleMessages],
  ["operatorAdminSuppliersMessages", operatorAdminSuppliersMessages],
  ["adminTeamMessages", adminTeamMessages],
]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function compareShapes(
  moduleName: string,
  locale: string,
  expected: unknown,
  actual: unknown,
  path: string[],
  errors: string[],
) {
  if (isPlainObject(expected)) {
    if (!isPlainObject(actual)) {
      errors.push(`${moduleName}:${locale} missing object at ${path.join(".") || "<root>"}`)
      return
    }

    for (const key of Object.keys(expected)) {
      if (!(key in actual)) {
        errors.push(`${moduleName}:${locale} missing key ${[...path, key].join(".")}`)
        continue
      }

      compareShapes(moduleName, locale, expected[key], actual[key], [...path, key], errors)
    }

    for (const key of Object.keys(actual)) {
      if (!(key in expected)) {
        errors.push(`${moduleName}:${locale} extra key ${[...path, key].join(".")}`)
      }
    }

    return
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      errors.push(`${moduleName}:${locale} expected array at ${path.join(".") || "<root>"}`)
    }
  }
}

const errors: string[] = []

for (const [moduleName, localeDefinitions] of definitions) {
  const english = localeDefinitions.en
  if (!english) {
    errors.push(`${moduleName} is missing required locale "en"`)
    continue
  }

  for (const [locale, messages] of Object.entries(localeDefinitions)) {
    if (locale === "en") {
      continue
    }

    compareShapes(moduleName, locale, english, messages, [], errors)
  }
}

if (errors.length > 0) {
  console.error("i18n locale parity check failed:\n")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`i18n locale parity check passed for ${definitions.length} definition sets.`)
