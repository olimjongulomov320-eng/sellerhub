import { notFound } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { getProduct } from '@/lib/services/products'
import { updateProductAction } from '@/lib/actions/products'
import { ProductForm } from '../../product-form'

export default async function EditProductPage(
  props: PageProps<'/[org]/products/[productId]/edit'>
) {
  const { org, productId } = await props.params
  const context = await requireOrgContext(org)
  const product = await getProduct(context.organizationId, productId)

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Изменить товар</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        action={updateProductAction}
        org={org}
        productId={productId}
        submitLabel="Сохранить изменения"
        defaults={{
          sku: product.sku,
          name: product.name,
          description: product.description,
          brand: product.brand,
          purchasePrice: product.purchasePrice.toString(),
          sellingPrice: product.sellingPrice.toString(),
          discountPrice: product.discountPrice?.toString() ?? null,
          currency: product.currency,
          unit: product.unit,
          weight: product.weight?.toString() ?? null,
          status: product.status,
          minimumStock: product.minimumStock,
        }}
      />
    </div>
  )
}
