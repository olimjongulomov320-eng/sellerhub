import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { getProduct } from '@/lib/services/products'
import { prisma } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { PRODUCT_STATUS_LABEL, LISTING_STATUS_LABEL } from '@/lib/utils/labels'

const SYNC_STATUS_LABEL = {
  SYNCED: 'Синхронизировано',
  PENDING: 'Ожидание',
  ERROR: 'Ошибка',
} as const

export default async function ProductDetailPage(
  props: PageProps<'/[org]/products/[productId]'>
) {
  const { org, productId } = await props.params
  const context = await requireOrgContext(org)

  const [product, organization] = await Promise.all([
    getProduct(context.organizationId, productId),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  if (!product) notFound()

  const available = (product.inventory?.physicalStock ?? 0) -
    (product.inventory?.reservedStock ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge tone={product.status === 'ACTIVE' ? 'success' : 'default'}>
              {PRODUCT_STATUS_LABEL[product.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Артикул: {product.sku}</p>
        </div>
        <Link href={`/${org}/products/${product.id}/edit`}>
          <Button variant="secondary">Изменить</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Цена продажи</p>
            <p className="mt-1.5 text-xl font-semibold">
              {formatCurrency(Number(product.sellingPrice), organization.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Доступный остаток</p>
            <p className="mt-1.5 text-xl font-semibold">{available}</p>
            <p className="text-xs text-muted-foreground">
              {product.inventory?.physicalStock ?? 0} физически, {' '}
              {product.inventory?.reservedStock ?? 0} в резерве
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Минимальный запас</p>
            <p className="mt-1.5 text-xl font-semibold">{product.minimumStock}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Обзор</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Бренд</p>
            <p>{product.brand ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Категория</p>
            <p>{product.category?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Поставщик</p>
            <p>{product.supplier?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Закупочная цена</p>
            <p>{formatCurrency(Number(product.purchasePrice), organization.currency)}</p>
          </div>
          {product.description && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Описание</p>
              <p>{product.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Объявление на OLX</CardTitle>
        </CardHeader>
        <CardContent>
          {product.listings.length === 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Не подключено. Подключите OLX, чтобы создать объявление для этого товара.
              </p>
              <Link href={`/${org}/integrations/olx`}>
                <Button variant="secondary" size="sm">
                  Перейти к интеграциям
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {product.listings.map((listing) => (
                <li
                  key={listing.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{listing.title}</p>
                    <p className="text-muted-foreground">
                      {listing.marketplace.name} · {LISTING_STATUS_LABEL[listing.status]}
                    </p>
                  </div>
                  <Badge tone={listing.status === 'ACTIVE' ? 'success' : 'default'}>
                    {SYNC_STATUS_LABEL[listing.syncStatus]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
