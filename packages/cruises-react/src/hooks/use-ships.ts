import { useQuery } from "@tanstack/react-query"

import { useVoyantCruisesContext } from "../provider.js"
import type { ShipsListFilters } from "../query-keys.js"
import {
  getCategoryCabinsQueryOptions,
  getShipCategoriesQueryOptions,
  getShipDecksQueryOptions,
  getShipQueryOptions,
  getShipsQueryOptions,
} from "../query-options.js"

export interface UseShipsOptions extends ShipsListFilters {
  enabled?: boolean
}

export function useShips(options: UseShipsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getShipsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

export interface UseShipOptions {
  enabled?: boolean
}

export function useShip(key: string | null | undefined, options: UseShipOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    ...getShipQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}

export function useShipDecks(key: string | null | undefined, options: UseShipOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    ...getShipDecksQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}

export function useShipCategories(key: string | null | undefined, options: UseShipOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    ...getShipCategoriesQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}

export function useCategoryCabins(
  categoryId: string | null | undefined,
  options: UseShipOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    ...getCategoryCabinsQueryOptions({ baseUrl, fetcher }, categoryId ?? ""),
    enabled: enabled && !!categoryId,
  })
}
