import Link from 'next/link'
import { requireOrgContext } from '@/lib/services/organization'
import { listProducts } from '@/lib/services/products'
import { prisma } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/dashboard/empty-state'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
} from '@/components/shared/data-table'
import { formatCurrency } from '@/lib/utils/format'
import { ProductRowActions } from './product-row-actions'

const STATUS_TONE = {
  ACTIVE: 'success',
  DRAFT: 'default',
  ARCHIVED: 'warning',
} as const

const STATUS_LABEL = {
  ACTIVE: 'Активен',
  DRAFT: 'Черновик',
  ARCHIVED: 'В архиве',
} as const

export default async function ProductsPage(
  props: PageProps<'/[org]/products'>
) {
  const { org } = await props.params
  const searchParams = await props.searchParams
  const context = await requireOrgContext(org)

  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : 'ALL'

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: context.organizationId },
    select: { currency: true },
  })

  const products = await listProducts(context.organizationId, {
    search,
    status: statusParam as 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'ALL',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Товары</h1>
          <p className="text-sm text-muted-foreground">
            Управляйте каталогом товаров.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${org}/products/import`}>
            <Button variant="secondary">Импорт</Button>
          </Link>
          <Link href={`/${org}/products/new`}>
            <Button>Добавить товар</Button>
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Поиск по названию, артикулу или бренду…"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={statusParam}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
        >
          <option value="ALL">Все статусы</option>
          <option value="ACTIVE">Активен</option>
          <option value="DRAFT">Черновик</option>
          <option value="ARCHIVED">В архиве</option>
        </select>
        <Button type="submit" variant="secondary">
          Применить
        </Button>
      </form>

      {products.length === 0 ? (
        <EmptyState
          title="Пока нет товаров"
          description="Добавьте первый товар, чтобы начать учёт склада и заказов."
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>Товар</Th>
            <Th>Артикул</Th>
            <Th>Цена</Th>
            <Th>Остаток</Th>
            <Th>Статус</Th>
            <Th className="text-right">Действия</Th>
          </DataTableHead>
          <DataTableBody>
            {products.map((product) => {
              const physicalStock = product.inventory?.physicalStock ?? 0
              const isLowStock = physicalStock <= product.minimumStock

              return (
                <tr key={product.id} className="hover:bg-surface-muted/50">
                  <Td>
                    <Link
                      href={`/${org}/products/${product.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">
                        {product.brand}
                      </p>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">{product.sku}</Td>
                  <Td>
                    {formatCurrency(Number(product.sellingPrice), organization.currency)}
                  </Td>
                  <Td>
                    <span className={isLowStock ? 'text-warning font-medium' : ''}>
                      {physicalStock}
                    </span>
                    {physicalStock === 0 && (
                      <Badge tone="danger" className="ml-2">
                        Нет в наличии
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[product.status]}>
                      {STATUS_LABEL[product.status]}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <ProductRowActions org={org} productId={product.id} />
                  </Td>
                </tr>
              )
            })}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
