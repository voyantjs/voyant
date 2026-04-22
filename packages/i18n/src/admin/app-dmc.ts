import { composeLocaleMessageDefinitions, type LocaleMessageDefinitions } from "../runtime.js"
import { type AdminAuthMessages, adminAuthMessages } from "./auth.js"
import { type AdminAvailabilityMessages, adminAvailabilityMessages } from "./availability.js"
import { type AdminBookingsMessages, adminBookingsMessages } from "./bookings.js"
import { type AdminChromeMessages, adminChromeMessages } from "./chrome.js"
import { type AdminContactsMessages, adminContactsMessages } from "./contacts.js"
import { type DmcAdminCoreMessages, dmcAdminCoreMessages } from "./core-dmc.js"
import {
  adminDmcDistributionMessages,
  type DmcAdminDistributionModuleMessages,
} from "./distribution-dmc.js"
import { type DmcAdminNavMessages, dmcAdminNavMessages } from "./dmc-nav.js"
import { type AdminFinanceMessages, adminFinanceMessages } from "./finance.js"
import {
  type AdminOrganizationsModuleMessages,
  adminOrganizationsModuleMessages,
} from "./organizations.js"
import { adminDmcProductsMessages, type DmcAdminProductsMessages } from "./products-dmc.js"
import { type AdminResourcesMessages, adminResourcesMessages } from "./resources.js"
import { type AdminSuppliersModuleMessages, adminSuppliersModuleMessages } from "./suppliers.js"
import { type AdminTeamMessages, adminTeamMessages } from "./team.js"

export type DmcAdminMessages = AdminChromeMessages & {
  auth: AdminAuthMessages
} & DmcAdminCoreMessages &
  AdminTeamMessages &
  AdminAvailabilityMessages &
  AdminBookingsMessages &
  AdminContactsMessages &
  AdminOrganizationsModuleMessages &
  AdminFinanceMessages &
  AdminResourcesMessages &
  AdminSuppliersModuleMessages &
  DmcAdminProductsMessages &
  DmcAdminDistributionModuleMessages & {
    nav: DmcAdminNavMessages
  }

export const dmcAdminMessageDefinitions = composeLocaleMessageDefinitions<DmcAdminMessages>(
  adminChromeMessages,
  adminAuthMessages,
  dmcAdminCoreMessages,
  adminTeamMessages,
  adminAvailabilityMessages,
  adminBookingsMessages,
  adminContactsMessages,
  adminOrganizationsModuleMessages,
  adminFinanceMessages,
  adminResourcesMessages,
  adminSuppliersModuleMessages,
  adminDmcProductsMessages,
  adminDmcDistributionMessages,
  dmcAdminNavMessages,
  {
    ro: {
      availability: {
        dialogs: {
          closeout: {
            reasonPlaceholder: "Vreme, blocaj charter, blackout operational...",
          },
          pickupPoint: {
            descriptionPlaceholder: "Instructiuni, repere, timing...",
          },
        },
      },
    },
  },
) satisfies LocaleMessageDefinitions<DmcAdminMessages>
