import { useNavigate } from "@tanstack/react-router"
import { ProductList } from "./product-list"

export function ProductsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your quotes, packages, and proposals.
        </p>
      </div>

      <ProductList
        onSelectProduct={(product) => {
          void navigate({ to: "/products/$id", params: { id: product.id } })
        }}
      />
    </div>
  )
}
