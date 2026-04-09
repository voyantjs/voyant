import { createFileRoute } from "@tanstack/react-router"

import { ProductTagList } from "@/components/voyant/products/product-tag-list"

export const Route = createFileRoute("/_workspace/settings/product-tags")({
  component: ProductTagsPage,
})

function ProductTagsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Product Tags</h2>
        <p className="text-sm text-muted-foreground">
          Free-form labels to tag and filter products.
        </p>
      </div>

      <ProductTagList />
    </div>
  )
}
