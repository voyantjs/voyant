"use client"

import { usePerson } from "@voyantjs/crm-react"
import { Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useAdminMessages } from "@/lib/admin-i18n"

import { PersonCard, type PersonCardProps } from "./person-card"

export interface PersonCardConnectedProps extends Omit<PersonCardProps, "person"> {
  personId: string
}

/**
 * Fetches a person by id and renders `<PersonCard />`. Use this when you
 * already have the id but not the full record.
 */
export function PersonCardConnected({ personId, ...props }: PersonCardConnectedProps) {
  const adminMessages = useAdminMessages()
  const messages = adminMessages.crm.personDetail
  const shared = adminMessages.crm.shared
  const { data, isPending, isError, error } = usePerson(personId)

  if (isPending) {
    return (
      <Card data-slot="person-card-connected-loading">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card data-slot="person-card-connected-error">
        <CardContent className="p-6 text-sm text-destructive">
          {messages.loadFailed}: {error instanceof Error ? error.message : shared.unknownError}
        </CardContent>
      </Card>
    )
  }

  return <PersonCard person={data} {...props} />
}
