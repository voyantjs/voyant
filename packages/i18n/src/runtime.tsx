"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

export type LocaleMessageDefinitions<T extends Record<string, unknown>> = Record<string, T>

export interface LocaleMessageOverrides<T extends Record<string, unknown>> {
  shared?: DeepPartial<T> | null
  locales?: Partial<Record<string, DeepPartial<T>>> | null
}

export type LocaleMessageSchema<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly LocaleMessageSchema<U>[]
    : T extends Array<infer U>
      ? Array<LocaleMessageSchema<U>>
      : T extends object
        ? { [K in keyof T]: LocaleMessageSchema<T[K]> }
        : T

function normalizeLocaleTag(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

function localeCandidates(locale: string | null | undefined): string[] {
  const normalized = normalizeLocaleTag(locale)
  if (!normalized) {
    return []
  }

  const language = normalized.split("-")[0]
  return language && language !== normalized ? [normalized, language] : [normalized]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getLocaleMessageOverridesFromUiPrefs<T extends Record<string, unknown>>(
  uiPrefs: unknown,
): LocaleMessageOverrides<T> | undefined {
  if (!isPlainObject(uiPrefs)) {
    return undefined
  }

  const i18n = uiPrefs.i18n
  if (!isPlainObject(i18n)) {
    return undefined
  }

  return isPlainObject(i18n.admin) ? (i18n.admin as LocaleMessageOverrides<T>) : undefined
}

function mergeDeep<T>(base: T, override?: DeepPartial<T> | null): T {
  if (override === undefined || override === null) {
    return base
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override as T
  }

  const result: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue
    }

    const existing = result[key]
    result[key] =
      isPlainObject(existing) && isPlainObject(value)
        ? mergeDeep(existing, value)
        : (value as unknown)
  }

  return result as T
}

function resolveRecordByLocale<T>(
  locale: string | null | undefined,
  record: Partial<Record<string, T>> | null | undefined,
): T | undefined {
  if (!record) {
    return undefined
  }

  const entries = Object.entries(record)
  for (const candidate of localeCandidates(locale)) {
    const match = entries.find(([key]) => normalizeLocaleTag(key) === candidate)
    if (match) {
      return match[1]
    }
  }

  return undefined
}

function resolveDefinitionLocale<T extends Record<string, unknown>>(
  locale: string | null | undefined,
  definitions: LocaleMessageDefinitions<T>,
  fallbackLocale: string,
): string {
  const keys = Object.keys(definitions)
  for (const candidate of localeCandidates(locale)) {
    const match = keys.find((key) => normalizeLocaleTag(key) === candidate)
    if (match) {
      return match
    }
  }

  const fallbackMatch = keys.find(
    (key) => normalizeLocaleTag(key) === normalizeLocaleTag(fallbackLocale),
  )
  return fallbackMatch ?? keys[0] ?? fallbackLocale
}

export function resolveLocaleMessages<T extends Record<string, unknown>>({
  locale,
  fallbackLocale,
  definitions,
  overrides,
}: {
  locale: string | null | undefined
  fallbackLocale: string
  definitions: LocaleMessageDefinitions<T>
  overrides?: LocaleMessageOverrides<T> | null
}): T {
  const fallbackKey = resolveDefinitionLocale(fallbackLocale, definitions, fallbackLocale)
  const localeKey = resolveDefinitionLocale(locale, definitions, fallbackKey)

  const fallbackMessages = definitions[fallbackKey]!
  const localeMessages = definitions[localeKey]

  const localeOverride =
    localeKey === fallbackKey ? undefined : (localeMessages as DeepPartial<T> | undefined)

  let resolved: T = mergeDeep<T>(fallbackMessages as T, localeOverride)
  resolved = mergeDeep(resolved, overrides?.shared)
  resolved = mergeDeep(resolved, resolveRecordByLocale(localeKey, overrides?.locales))

  return resolved
}

export function useResolvedLocaleMessages<T extends Record<string, unknown>>({
  locale,
  fallbackLocale,
  definitions,
  overrides,
}: {
  locale: string | null | undefined
  fallbackLocale: string
  definitions: LocaleMessageDefinitions<T>
  overrides?: LocaleMessageOverrides<T> | null
}): T {
  return useMemo(
    () =>
      resolveLocaleMessages({
        locale,
        fallbackLocale,
        definitions,
        overrides,
      }),
    [definitions, fallbackLocale, locale, overrides],
  )
}

export function composeLocaleMessageDefinitions<T extends Record<string, unknown>>(
  ...definitions: Array<Partial<Record<string, DeepPartial<T>>>>
): LocaleMessageDefinitions<T> {
  const result: Record<string, unknown> = {}

  for (const definition of definitions) {
    for (const [locale, messages] of Object.entries(definition)) {
      const existing = result[locale]
      result[locale] =
        isPlainObject(existing) && isPlainObject(messages)
          ? mergeDeep(existing, messages)
          : messages
    }
  }

  return result as LocaleMessageDefinitions<T>
}

export function formatMessage(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key]
    return value === null || value === undefined ? "" : String(value)
  })
}

const MessagesContext = createContext<Record<string, unknown> | undefined>(undefined)

export function MessagesProvider<T extends Record<string, unknown>>({
  children,
  messages,
}: {
  children: ReactNode
  messages: T
}) {
  return <MessagesContext.Provider value={messages}>{children}</MessagesContext.Provider>
}

export function useMessages<T extends Record<string, unknown>>(): T {
  const context = useContext(MessagesContext)
  if (!context) {
    throw new Error("useMessages must be used within <MessagesProvider>")
  }

  return context as T
}
