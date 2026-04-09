import { createFileRoute } from "@tanstack/react-router"

import { PricingCategoryList } from "@/components/voyant/pricing/pricing-category-list"

export const Route = createFileRoute("/_workspace/settings/pricing-categories")({
  component: PricingCategoriesPage,
})

function PricingCategoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Pricing Categories</h2>
        <p className="text-sm text-muted-foreground">
          Global categories like adult, child, and room reused across your pricing rules.
        </p>
      </div>

      <PricingCategoryList />
    </div>
  )
}
