import { createFileRoute } from "@tanstack/react-router"

import { AccountPage } from "@/components/voyant/account/account-page"

export const Route = createFileRoute("/_workspace/account")({
  component: AccountPage,
})
