import { useNavigate } from "@tanstack/react-router"
import { useAdminMessages } from "@/lib/admin-i18n"
import { ProductList } from "./product-list"

export function ProductsPage() {
  const navigate = useNavigate()
  const messages = useAdminMessages()
  const productMessages = messages.products.core

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{productMessages.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{productMessages.pageDescription}</p>
      </div>

      <ProductList
        onSelectProduct={(product) => {
          void navigate({ to: "/products/$id", params: { id: product.id } })
        }}
      />
    </div>
  )
}
