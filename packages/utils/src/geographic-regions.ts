/**
 * Geographic region utilities for filtering products by world regions.
 *
 * Regions follow the UN geoscheme (M49) standard:
 * - af: Africa
 * - an: Antarctica
 * - as: Asia
 * - eu: Europe
 * - na: North America
 * - oc: Oceania
 * - sa: South America
 * - me: Middle East (custom, subset of Asia/Africa)
 */

/**
 * Geographic region codes
 */
export type GeographicRegionCode = "af" | "an" | "as" | "eu" | "na" | "oc" | "sa" | "me"

/**
 * Geographic region metadata
 */
export interface GeographicRegion {
  code: GeographicRegionCode
  name: string
}

/**
 * All available geographic regions
 */
export const GEOGRAPHIC_REGIONS: GeographicRegion[] = [
  { code: "af", name: "Africa" },
  { code: "an", name: "Antarctica" },
  { code: "as", name: "Asia" },
  { code: "eu", name: "Europe" },
  { code: "na", name: "North America" },
  { code: "oc", name: "Oceania" },
  { code: "sa", name: "South America" },
  { code: "me", name: "Middle East" },
]

/**
 * Country codes grouped by geographic region
 * ISO 3166-1 alpha-2 country codes
 */
const REGION_COUNTRIES: Record<GeographicRegionCode, string[]> = {
  // Africa
  af: [
    "DZ",
    "AO",
    "BJ",
    "BW",
    "BF",
    "BI",
    "CV",
    "CM",
    "CF",
    "TD",
    "KM",
    "CG",
    "CD",
    "CI",
    "DJ",
    "EG",
    "GQ",
    "ER",
    "SZ",
    "ET",
    "GA",
    "GM",
    "GH",
    "GN",
    "GW",
    "KE",
    "LS",
    "LR",
    "LY",
    "MG",
    "MW",
    "ML",
    "MR",
    "MU",
    "YT",
    "MA",
    "MZ",
    "NA",
    "NE",
    "NG",
    "RW",
    "RE",
    "SH",
    "ST",
    "SN",
    "SC",
    "SL",
    "SO",
    "ZA",
    "SS",
    "SD",
    "TZ",
    "TG",
    "TN",
    "UG",
    "EH",
    "ZM",
    "ZW",
  ],

  // Antarctica
  an: ["AQ", "BV", "GS", "HM", "TF"],

  // Asia (excluding Middle East countries)
  as: [
    "AF",
    "AM",
    "AZ",
    "BD",
    "BT",
    "BN",
    "KH",
    "CN",
    "CY",
    "GE",
    "HK",
    "IN",
    "ID",
    "JP",
    "KZ",
    "KP",
    "KR",
    "KG",
    "LA",
    "MO",
    "MY",
    "MV",
    "MN",
    "MM",
    "NP",
    "PK",
    "PH",
    "SG",
    "LK",
    "TW",
    "TJ",
    "TH",
    "TL",
    "TM",
    "UZ",
    "VN",
  ],

  // Europe
  eu: [
    "AL",
    "AD",
    "AT",
    "BY",
    "BE",
    "BA",
    "BG",
    "HR",
    "CZ",
    "DK",
    "EE",
    "FO",
    "FI",
    "FR",
    "DE",
    "GI",
    "GR",
    "GG",
    "HU",
    "IS",
    "IE",
    "IM",
    "IT",
    "JE",
    "XK",
    "LV",
    "LI",
    "LT",
    "LU",
    "MT",
    "MD",
    "MC",
    "ME",
    "NL",
    "MK",
    "NO",
    "PL",
    "PT",
    "RO",
    "RU",
    "SM",
    "RS",
    "SK",
    "SI",
    "ES",
    "SJ",
    "SE",
    "CH",
    "UA",
    "GB",
    "VA",
    "AX",
  ],

  // North America (including Central America and Caribbean)
  na: [
    "AI",
    "AG",
    "AW",
    "BS",
    "BB",
    "BZ",
    "BM",
    "CA",
    "KY",
    "CR",
    "CU",
    "CW",
    "DM",
    "DO",
    "SV",
    "GL",
    "GD",
    "GP",
    "GT",
    "HT",
    "HN",
    "JM",
    "MQ",
    "MX",
    "MS",
    "NI",
    "PA",
    "PR",
    "BL",
    "KN",
    "LC",
    "MF",
    "PM",
    "VC",
    "SX",
    "TT",
    "TC",
    "US",
    "VI",
    "VG",
  ],

  // Oceania (Australia, New Zealand, Pacific Islands)
  oc: [
    "AS",
    "AU",
    "CK",
    "FJ",
    "PF",
    "GU",
    "KI",
    "MH",
    "FM",
    "NR",
    "NC",
    "NZ",
    "NU",
    "NF",
    "MP",
    "PW",
    "PG",
    "PN",
    "WS",
    "SB",
    "TK",
    "TO",
    "TV",
    "UM",
    "VU",
    "WF",
    "CX",
    "CC",
  ],

  // South America
  sa: ["AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PY", "PE", "SR", "UY", "VE"],

  // Middle East (custom region for travel industry)
  me: ["BH", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "TR", "AE", "YE"],
}

/**
 * Reverse lookup: country code to region
 */
const COUNTRY_TO_REGION: Map<string, GeographicRegionCode> = new Map()

// Build reverse lookup
for (const [region, countries] of Object.entries(REGION_COUNTRIES)) {
  for (const country of countries) {
    COUNTRY_TO_REGION.set(country, region as GeographicRegionCode)
  }
}

/**
 * Get the geographic region for a country code.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "RO", "EG")
 * @returns Geographic region code or null if not found
 *
 * @example
 * getGeographicRegion("RO") // "eu"
 * getGeographicRegion("EG") // "af"
 * getGeographicRegion("AE") // "me"
 */
export function getGeographicRegion(countryCode: string): GeographicRegionCode | null {
  const normalized = countryCode?.trim().toUpperCase()
  if (!normalized) return null
  return COUNTRY_TO_REGION.get(normalized) ?? null
}

/**
 * Get all country codes for a geographic region.
 *
 * @param region - Geographic region code (e.g., "eu", "af")
 * @returns Array of ISO 3166-1 alpha-2 country codes
 *
 * @example
 * getCountriesByRegion("eu") // ["AL", "AD", "AT", ...]
 * getCountriesByRegion("me") // ["BH", "IR", "IQ", ...]
 */
export function getCountriesByRegion(region: GeographicRegionCode): string[] {
  return REGION_COUNTRIES[region] ?? []
}

/**
 * Check if a string is a valid geographic region code.
 *
 * @param code - String to check
 * @returns True if the code is a valid region code
 */
export function isValidRegionCode(code: string): code is GeographicRegionCode {
  return GEOGRAPHIC_REGIONS.some((r) => r.code === code)
}

/**
 * Get region metadata by code.
 *
 * @param code - Geographic region code
 * @returns Region metadata or null if not found
 */
export function getRegionByCode(code: string): GeographicRegion | null {
  return GEOGRAPHIC_REGIONS.find((r) => r.code === code) ?? null
}
