"use client"

import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ExternalCruiseBadgeProps extends React.ComponentPropsWithoutRef<typeof Badge> {
  /** The adapter that sourced the cruise (e.g. "voyant-connect", "custom"). */
  sourceProvider: string
}

/**
 * Small inline badge that surfaces cruise provenance to admin/storefront UIs.
 * Renders as a subtle "External · <provider>" pill so operators (and shoppers,
 * if the storefront opts in) can see at a glance which inventory comes from
 * upstream and which is the operator's own.
 */
export function ExternalCruiseBadge({
  sourceProvider,
  className,
  ...props
}: ExternalCruiseBadgeProps) {
  return (
    <Badge
      data-slot="external-cruise-badge"
      variant="outline"
      className={cn("font-normal", className)}
      title={`Sourced via ${sourceProvider}`}
      {...props}
    >
      <span aria-hidden="true" className="mr-1">
        ↗
      </span>
      External · {sourceProvider}
    </Badge>
  )
}
