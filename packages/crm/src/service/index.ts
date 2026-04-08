import { accountsService } from "./accounts.js"
import { activitiesService } from "./activities.js"
import { customFieldsService } from "./custom-fields.js"
import { opportunitiesService } from "./opportunities.js"
import { pipelinesService } from "./pipelines.js"
import { quotesService } from "./quotes.js"

export const crmService = {
  ...accountsService,
  ...pipelinesService,
  ...opportunitiesService,
  ...quotesService,
  ...activitiesService,
  ...customFieldsService,
}
