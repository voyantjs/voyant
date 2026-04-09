import { createFileRoute } from "@tanstack/react-router"

import { ProductCategoryList } from "@/components/voyant/products/product-category-list"

export const Route = createFileRoute("/_workspace/products/categories")({
  component: CategoriesPage,
})

function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Hierarchical product categories for organizing your catalog.
        </p>
      </div>

      <ProductCategoryList />
    </div>
  )
}
