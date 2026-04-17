/**
 * @voyantjs/voyant-admin — shared admin-dashboard shell for Voyant templates.
 *
 * Exports:
 * - Theme provider: zero-dependency ThemeProvider + useTheme that toggles
 *   `light`/`dark` classes on `document.documentElement` and honors
 *   `prefers-color-scheme` for the "system" mode.
 * - Locale provider: useLocale + LocaleProvider for admin locale/timezone
 *   resolution and persistence.
 * - Query client factory: `makeQueryClient()` with Voyant's admin defaults.
 * - `AdminProvider` composing QueryClient + ThemeProvider + LocaleProvider.
 * - User utilities: `getInitials`, `getDisplayName`.
 * - Types: `AdminUser`, `NavItem`, `NavSubItem`, `AuthActions`, `ThemeMode`.
 */

export { getDisplayName, getInitials } from "./lib/initials.js"
export { AdminProvider, type AdminProviderProps } from "./providers/admin-provider.js"
export {
  DEFAULT_ADMIN_LOCALE,
  DEFAULT_ADMIN_LOCALES,
  type LocaleContextValue,
  LocaleProvider,
  type LocaleProviderProps,
  resolveAdminLocale,
  useLocale,
} from "./providers/locale.js"
export { makeQueryClient } from "./providers/query-client.js"
export {
  type ThemeContextValue,
  ThemeProvider,
  type ThemeProviderProps,
  useTheme,
} from "./providers/theme.js"
export {
  type AdminUser,
  type AuthActions,
  BETA,
  COMING_SOON,
  type NavItem,
  type NavItemStatus,
  type NavSubItem,
  type ThemeMode,
} from "./types.js"
