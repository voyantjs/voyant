"use client"

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react"

import type { ThemeMode } from "../types.js"

export interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export interface ThemeProviderProps {
  children: ReactNode
  /** Initial theme when no persisted value exists. Defaults to "system". */
  defaultTheme?: ThemeMode
  /**
   * localStorage key used to persist the user's selection. Defaults to "theme".
   * Set to `null` to disable persistence (useful for tests).
   */
  storageKey?: string | null
}

/**
 * Lightweight theme provider. Mirrors next-themes semantics but has zero deps:
 * stores selection in localStorage, toggles the `light`/`dark` class on
 * `document.documentElement`, and honors `prefers-color-scheme` when mode
 * is "system".
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return defaultTheme
    if (storageKey === null) return defaultTheme
    return (localStorage.getItem(storageKey) as ThemeMode | null) ?? defaultTheme
  })

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme)
      if (typeof window !== "undefined" && storageKey !== null) {
        localStorage.setItem(storageKey, newTheme)
      }
    },
    [storageKey],
  )

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== "system") return
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(getSystemTheme())
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Reads the current theme. Throws if used outside `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>")
  }
  return ctx
}
