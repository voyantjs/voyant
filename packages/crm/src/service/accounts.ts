import { organizationAccountsService } from "./accounts-organizations.js"
import { peopleAccountsService } from "./accounts-people.js"

export const accountsService = {
  ...organizationAccountsService,
  ...peopleAccountsService,
}
