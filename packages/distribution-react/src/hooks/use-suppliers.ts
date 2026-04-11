"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { SuppliersListFilters } from "../query-keys.js"
import { getSuppliersQueryOptions } from "../query-options.js"

export interface UseSuppliersOptions extends SuppliersListFilters {
  enabled?: boolean
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getSuppliersQueryOptions(client, options), enabled })
}
