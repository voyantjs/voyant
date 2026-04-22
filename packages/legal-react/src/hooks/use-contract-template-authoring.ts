import {
  contractTemplateLiquidSnippets,
  contractTemplateVariableCatalog,
} from "@voyantjs/legal/contracts"

export function useLegalContractTemplateAuthoring() {
  return {
    variableCatalog: contractTemplateVariableCatalog,
    liquidSnippets: contractTemplateLiquidSnippets,
  }
}
