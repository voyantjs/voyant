import { describe, expect, it } from "vitest"

import {
  dmcAdminMessageDefinitions,
  getLocaleMessageOverridesFromUiPrefs,
  resolveLocaleMessages,
} from "../../src/lib/i18n.js"

type TestMessages = {
  loading: string
  nav: {
    dashboard: string
    settings: string
  }
}

describe("i18n helpers", () => {
  it("resolves locale dictionaries with fallback and deep overrides", () => {
    const result = resolveLocaleMessages<TestMessages>({
      locale: "ro-RO",
      fallbackLocale: "en",
      definitions: {
        en: {
          loading: "Loading...",
          nav: {
            dashboard: "Dashboard",
            settings: "Settings",
          },
        },
        ro: {
          loading: "Se incarca...",
          nav: {
            dashboard: "Panou",
            settings: "Setari",
          },
        },
      },
      overrides: {
        shared: {
          nav: {
            settings: "Preferences",
          },
        },
        locales: {
          ro: {
            loading: "Se personalizeaza...",
          },
        },
      },
    })

    expect(result.loading).toBe("Se personalizeaza...")
    expect(result.nav.dashboard).toBe("Panou")
    expect(result.nav.settings).toBe("Preferences")
  })

  it("reads admin locale overrides from ui prefs", () => {
    const result = getLocaleMessageOverridesFromUiPrefs<TestMessages>({
      i18n: {
        admin: {
          locales: {
            ro: {
              nav: {
                settings: "Preferinte",
              },
            },
          },
        },
      },
    })

    expect(result?.locales?.ro?.nav?.settings).toBe("Preferinte")
  })

  it("returns undefined for invalid ui prefs override payloads", () => {
    expect(getLocaleMessageOverridesFromUiPrefs<TestMessages>(null)).toBeUndefined()
    expect(getLocaleMessageOverridesFromUiPrefs<TestMessages>({})).toBeUndefined()
    expect(
      getLocaleMessageOverridesFromUiPrefs<TestMessages>({
        i18n: {
          admin: [],
        },
      }),
    ).toBeUndefined()
  })

  it("includes package-owned DMC app overrides in the composed definitions", () => {
    expect(dmcAdminMessageDefinitions.ro?.availability?.dialogs?.closeout?.reasonPlaceholder).toBe(
      "Vreme, blocaj charter, blackout operational...",
    )
  })
})
