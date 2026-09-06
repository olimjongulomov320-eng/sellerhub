import { requireOrgContext } from '@/lib/services/organization'
import { prisma } from '@/lib/db/client'
import { NewOrderForm } from './new-order-form'

export default async function NewOrderPage(props: PageProps<'/[org]/orders/new'>) {
  const { org } = await props.params
  const context = await requireOrgContext(org)

  const [products, customers, organization] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: context.organizationId, status: 'ACTIVE' },
      include: { inventory: true },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      where: { organizationId: context.organizationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    sellingPrice: p.sellingPrice.toString(),
    available: (p.inventory?.physicalStock ?? 0) - (p.inventory?.reservedStock ?? 0),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Новый заказ</h1>
        <p className="text-sm text-muted-foreground">
          Создайте заказ вручную — запас будет списан автоматически.
        </p>
      </div>

      {productOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Добавьте хотя бы один активный товар перед созданием заказа.
        </p>
      ) : (
        <NewOrderForm
          org={org}
          products={productOptions}
          customers={customers}
          currency={organization.currency}
        />
      )}
    </div>
  )
}
