import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AdminProvider } from "../../src/providers/admin-provider.js"
import { useTheme } from "../../src/providers/theme.js"

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove("light", "dark")
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterEach(() => {
  localStorage.clear()
})

describe("AdminProvider", () => {
  it("provides a QueryClient to its children", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AdminProvider themeStorageKey={null}>{children}</AdminProvider>
    )
    const { result } = renderHook(() => useQueryClient(), { wrapper })
    expect(result.current).toBeInstanceOf(QueryClient)
  })

  it("uses the injected QueryClient when provided", () => {
    const external = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AdminProvider queryClient={external} themeStorageKey={null}>
        {children}
      </AdminProvider>
    )
    const { result } = renderHook(() => useQueryClient(), { wrapper })
    expect(result.current).toBe(external)
  })

  it("provides the ThemeProvider to its children", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AdminProvider themeStorageKey={null} defaultTheme="dark">
        {children}
      </AdminProvider>
    )
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
  })

  it("defaults theme to 'system' when defaultTheme is not set", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AdminProvider themeStorageKey={null}>{children}</AdminProvider>
    )
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("system")
  })

  it("honors themeStorageKey=null to disable persistence", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AdminProvider themeStorageKey={null}>{children}</AdminProvider>
    )
    renderHook(() => useTheme(), { wrapper })
    expect(localStorage.length).toBe(0)
  })
})
