import { act, render, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider, useTheme } from "../../src/providers/theme.js"

function wrap(
  props: {
    children?: ReactNode
    defaultTheme?: "light" | "dark" | "system"
    storageKey?: string | null
  } = {},
) {
  return ({ children }: { children: ReactNode }) => (
    <ThemeProvider
      defaultTheme={props.defaultTheme ?? "system"}
      storageKey={props.storageKey === undefined ? "theme-test" : props.storageKey}
    >
      {children}
    </ThemeProvider>
  )
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark")
    // Mock matchMedia so getSystemTheme has a predictable answer.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false, // default: not dark
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

  it("defaults to 'system' when no persisted value and no defaultTheme given", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap() })
    expect(result.current.theme).toBe("system")
  })

  it("uses the defaultTheme prop when provided", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrap({ defaultTheme: "dark" }),
    })
    expect(result.current.theme).toBe("dark")
  })

  it("reads from localStorage when a persisted value exists", () => {
    localStorage.setItem("theme-test", "light")
    const { result } = renderHook(() => useTheme(), { wrapper: wrap() })
    expect(result.current.theme).toBe("light")
  })

  it("persists setTheme to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap() })
    act(() => result.current.setTheme("dark"))
    expect(localStorage.getItem("theme-test")).toBe("dark")
    expect(result.current.theme).toBe("dark")
  })

  it("does not persist when storageKey is null", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrap({ storageKey: null }),
    })
    act(() => result.current.setTheme("dark"))
    expect(localStorage.getItem("theme")).toBeNull()
    expect(localStorage.getItem("theme-test")).toBeNull()
    expect(result.current.theme).toBe("dark")
  })

  it("applies the resolved class to document.documentElement", () => {
    renderHook(() => useTheme(), { wrapper: wrap({ defaultTheme: "dark" }) })
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("resolves 'system' to light when prefers-color-scheme:dark is false", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrap({ defaultTheme: "system" }),
    })
    expect(result.current.resolvedTheme).toBe("light")
  })

  it("resolves 'system' to dark when prefers-color-scheme:dark is true", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrap({ defaultTheme: "system" }),
    })
    expect(result.current.resolvedTheme).toBe("dark")
  })

  it("useTheme throws when used outside ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(/useTheme must be used within/)
  })

  it("updates the DOM class when switching themes", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrap({ defaultTheme: "light" }),
    })
    expect(document.documentElement.classList.contains("light")).toBe(true)
    act(() => result.current.setTheme("dark"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("renders children inside the provider", () => {
    const { getByText } = render(
      <ThemeProvider storageKey={null}>
        <span>content</span>
      </ThemeProvider>,
    )
    expect(getByText("content")).toBeTruthy()
  })
})
