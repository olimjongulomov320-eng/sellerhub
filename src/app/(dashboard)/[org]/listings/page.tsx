import Link from 'next/link'
import { requireOrgContext } from '@/lib/services/organization'
import { prisma } from '@/lib/db/client'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
} from '@/components/shared/data-table'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { LISTING_STATUS_LABEL } from '@/lib/utils/labels'

export default async function ListingsPage(props: PageProps<'/[org]/listings'>) {
  const { org } = await props.params
  const context = await requireOrgContext(org)

  const [listings, organization] = await Promise.all([
    prisma.listing.findMany({
      where: { organizationId: context.organizationId },
      include: { product: true, marketplace: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Объявления</h1>
        <p className="text-sm text-muted-foreground">
          Все объявления на маркетплейсах по подключённым каналам.
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="Объявлений пока нет"
          description="Подключите OLX, чтобы создавать и управлять объявлениями для ваших товаров."
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>Объявление</Th>
            <Th>Товар</Th>
            <Th>Канал</Th>
            <Th>Цена</Th>
            <Th>Просмотры</Th>
            <Th>Статус</Th>
          </DataTableHead>
          <DataTableBody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                <Td className="font-medium">{listing.title}</Td>
                <Td>
                  <Link
                    href={`/${org}/products/${listing.productId}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {listing.product.name}
                  </Link>
                </Td>
                <Td className="text-muted-foreground">{listing.marketplace.name}</Td>
                <Td>{formatCurrency(Number(listing.price), organization.currency)}</Td>
                <Td className="text-muted-foreground">
                  {listing.views !== null ? formatNumber(listing.views) : '—'}
                </Td>
                <Td>
                  <Badge tone={listing.status === 'ACTIVE' ? 'success' : 'default'}>
                    {LISTING_STATUS_LABEL[listing.status]}
                  </Badge>
                </Td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
