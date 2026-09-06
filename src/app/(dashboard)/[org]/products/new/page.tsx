import { requireOrgContext } from '@/lib/services/organization'
import { createProductAction } from '@/lib/actions/products'
import { ProductForm } from '../product-form'

export default async function NewProductPage(
  props: PageProps<'/[org]/products/new'>
) {
  const { org } = await props.params
  await requireOrgContext(org)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Добавить товар</h1>
        <p className="text-sm text-muted-foreground">
          Создайте новый товар в каталоге.
        </p>
      </div>
      <ProductForm
        action={createProductAction}
        org={org}
        submitLabel="Создать товар"
        showInitialStock
      />
    </div>
  )
}
