import { createFileRoute } from "@tanstack/react-router"

import { PricingCategoryDependencyList } from "@/components/voyant/pricing/pricing-category-dependency-list"

export const Route = createFileRoute("/_workspace/settings/pricing/category-dependencies")({
  component: CategoryDependenciesPage,
})

function CategoryDependenciesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Category Dependencies</h2>
        <p className="text-sm text-muted-foreground">
          Rules between pricing categories such as requires, excludes, and quantity limits.
        </p>
      </div>

      <PricingCategoryDependencyList />
    </div>
  )
}
