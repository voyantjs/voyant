import { ProductTagList } from "@/components/voyant/products/product-tag-list"

export function ProductTagsPage() {
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
