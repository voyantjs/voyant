import type * as React from "react"

import type { NavItem } from "./types.js"

/**
 * A named route contribution for the admin shell.
 *
 * This is metadata only in the initial implementation. Templates remain free
 * to decide how route registration is wired into their router/runtime.
 */
export interface AdminUiRouteContribution {
  id: string
  path: string
  title: string
}

/**
 * Contribute one or more navigation items to the shared admin shell.
 *
 * Contributions are appended after the template's base navigation and sorted
 * by `order`.
 */
export interface AdminNavigationContribution {
  items: ReadonlyArray<NavItem>
  order?: number
}

/**
 * Named widget slot identifier.
 *
 * Templates define the slots they expose on specific admin pages and modules
 * or extensions can target them with React components.
 */
export type AdminWidgetSlot = string

/**
 * A widget contribution that can be rendered inside a template-defined slot.
 */
export interface AdminWidgetContribution<Props = Record<string, unknown>> {
  id: string
  slot: AdminWidgetSlot
  order?: number
  component: React.ComponentType<Props>
}

/**
 * Shared admin extension bundle.
 *
 * This keeps the extension surface explicit and typed without forcing a more
 * dynamic plugin runtime into templates.
 */
export interface AdminExtension {
  id: string
  navigation?: ReadonlyArray<AdminNavigationContribution>
  routes?: ReadonlyArray<AdminUiRouteContribution>
  widgets?: ReadonlyArray<AdminWidgetContribution>
}

export function defineAdminExtension<T extends AdminExtension>(extension: T): T {
  return extension
}

/**
 * Compose an explicit admin extension registry for a template or app shell.
 *
 * The admin surface stays source-controlled and typed while still routing
 * all contributions through the shared admin runtime package.
 */
export function createAdminExtensionRegistry(
  ...extensions: ReadonlyArray<AdminExtension>
): ReadonlyArray<AdminExtension> {
  return extensions
}

type OrderedValue<T> = {
  index: number
  order: number
  value: T
}

function sortOrderedValues<T>(values: ReadonlyArray<OrderedValue<T>>): T[] {
  return [...values]
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }

      return a.index - b.index
    })
    .map((entry) => entry.value)
}

export interface ResolveAdminNavigationOptions {
  baseItems: ReadonlyArray<NavItem>
  extensions?: ReadonlyArray<AdminExtension>
}

export function resolveAdminNavigation({
  baseItems,
  extensions = [],
}: ResolveAdminNavigationOptions): NavItem[] {
  const contributions = extensions.flatMap((extension) => extension.navigation ?? [])
  const orderedContributions = sortOrderedValues(
    contributions.map((contribution, index) => ({
      index,
      order: contribution.order ?? 0,
      value: contribution,
    })),
  )

  return [...baseItems, ...orderedContributions.flatMap((contribution) => contribution.items)]
}

export interface ResolveAdminWidgetsOptions {
  slot: AdminWidgetSlot
  extensions?: ReadonlyArray<AdminExtension>
}

export function resolveAdminWidgets({
  slot,
  extensions = [],
}: ResolveAdminWidgetsOptions): AdminWidgetContribution[] {
  const widgets = extensions
    .flatMap((extension) => extension.widgets ?? [])
    .filter((widget) => widget.slot === slot)

  return sortOrderedValues(
    widgets.map((widget, index) => ({
      index,
      order: widget.order ?? 0,
      value: widget,
    })),
  )
}
