import { contractRecordsService } from "./service-contracts.js"
import { contractDocumentsService } from "./service-documents.js"
import { contractSeriesService } from "./service-series.js"
import {
  allocateContractNumber,
  renderTemplate,
  validateTemplateVariables,
} from "./service-shared.js"
import { contractTemplatesService } from "./service-templates.js"

export { allocateContractNumber, renderTemplate, validateTemplateVariables }

export const contractsService = {
  ...contractTemplatesService,
  ...contractSeriesService,
  ...contractRecordsService,
  ...contractDocumentsService,
}
