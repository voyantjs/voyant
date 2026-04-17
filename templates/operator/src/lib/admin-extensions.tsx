import type { AdminExtension } from "@voyantjs/voyant-admin"

/**
 * Template-local admin extension registry.
 *
 * Keep this explicit and source-controlled so projects can add navigation
 * contributions, widget slots, and route metadata without relying on a more
 * dynamic plugin runtime in the admin shell.
 */
export const adminExtensions: ReadonlyArray<AdminExtension> = []
