import { useLocale } from "@voyantjs/voyant-admin"

type AdminShellMessages = {
  loading: string
  account: string
  notifications: string
  logOut: string
  light: string
  dark: string
  language: string
  english: string
  romanian: string
  createOrganization: string
  nav: {
    dashboard: string
    products: string
    categories: string
    bookings: string
    suppliers: string
    people: string
    organizations: string
    availability: string
    resources: string
    finance: string
    settings: string
  }
}

const adminMessages: Record<string, AdminShellMessages> = {
  en: {
    loading: "Loading...",
    account: "Account",
    notifications: "Notifications",
    logOut: "Log out",
    light: "Light",
    dark: "Dark",
    language: "Language",
    english: "English",
    romanian: "Romanian",
    createOrganization: "Create organization",
    nav: {
      dashboard: "Dashboard",
      products: "Products",
      categories: "Categories",
      bookings: "Bookings",
      suppliers: "Suppliers",
      people: "People",
      organizations: "Organizations",
      availability: "Availability",
      resources: "Resources",
      finance: "Finance",
      settings: "Settings",
    },
  },
  ro: {
    loading: "Se încarcă...",
    account: "Cont",
    notifications: "Notificări",
    logOut: "Deconectare",
    light: "Luminos",
    dark: "Întunecat",
    language: "Limbă",
    english: "Engleză",
    romanian: "Română",
    createOrganization: "Creează organizație",
    nav: {
      dashboard: "Panou",
      products: "Produse",
      categories: "Categorii",
      bookings: "Rezervări",
      suppliers: "Furnizori",
      people: "Persoane",
      organizations: "Organizații",
      availability: "Disponibilitate",
      resources: "Resurse",
      finance: "Financiar",
      settings: "Setări",
    },
  },
}

export function useAdminMessages(): AdminShellMessages {
  const { resolvedLocale } = useLocale()
  return adminMessages[resolvedLocale] ?? adminMessages.en
}
