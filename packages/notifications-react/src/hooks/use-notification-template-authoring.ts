"use client"

import {
  notificationLiquidSnippets,
  notificationTemplateVariableCatalog,
} from "@voyantjs/notifications"

export function useNotificationTemplateAuthoring() {
  return {
    variableCatalog: notificationTemplateVariableCatalog,
    liquidSnippets: notificationLiquidSnippets,
  }
}
