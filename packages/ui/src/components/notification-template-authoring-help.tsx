"use client"

import type {
  NotificationLiquidSnippet,
  NotificationTemplateVariableCategory,
  NotificationTemplateVariableDefinition,
} from "@voyantjs/notifications"

import {
  ContractTemplateAuthoringHelp,
  type TemplateAuthoringSnippet,
  type TemplateAuthoringVariable,
  type TemplateAuthoringVariableGroup,
} from "./contract-template-authoring-help"

type NotificationTemplateAuthoringHelpProps = {
  variableGroups: NotificationTemplateVariableCategory[]
  snippets?: NotificationLiquidSnippet[]
  onInsertVariable?: (variable: NotificationTemplateVariableDefinition) => void
  onInsertSnippet?: (snippet: NotificationLiquidSnippet) => void
  className?: string
}

export function NotificationTemplateAuthoringHelp({
  variableGroups,
  snippets = [],
  onInsertVariable,
  onInsertSnippet,
  className,
}: NotificationTemplateAuthoringHelpProps) {
  return (
    <ContractTemplateAuthoringHelp
      className={className}
      title="Notification variables"
      description="Notifications render with Liquid. Use variables for subject/body content and control tags for conditionals or loops."
      variableGroups={variableGroups as TemplateAuthoringVariableGroup[]}
      snippets={snippets as TemplateAuthoringSnippet[]}
      onInsertVariable={
        onInsertVariable as ((variable: TemplateAuthoringVariable) => void) | undefined
      }
      onInsertSnippet={onInsertSnippet as ((snippet: TemplateAuthoringSnippet) => void) | undefined}
    />
  )
}
