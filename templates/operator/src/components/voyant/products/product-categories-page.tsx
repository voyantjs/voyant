import { ProductCategoryList } from "./product-category-list"

export function ProductCategoriesPage() {
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
