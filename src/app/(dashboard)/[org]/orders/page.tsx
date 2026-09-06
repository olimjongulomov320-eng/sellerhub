import Link from 'next/link'
import { requireOrgContext } from '@/lib/services/organization'
import { listOrders } from '@/lib/services/orders'
import { prisma } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
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
import { ORDER_STATUS_LABEL, ORDER_SOURCE_LABEL } from '@/lib/utils/labels'
import type { OrderStatus } from '@prisma/client'

const STATUS_TONE: Record<OrderStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NEW: 'info',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  READY: 'warning',
  SHIPPED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
}

export default async function OrdersPage(props: PageProps<'/[org]/orders'>) {
  const { org } = await props.params
  const searchParams = await props.searchParams
  const context = await requireOrgContext(org)

  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : 'ALL'
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined

  const [orders, organization] = await Promise.all([
    listOrders(context.organizationId, {
      status: statusParam as OrderStatus | 'ALL',
      search,
    }),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Заказы</h1>
          <p className="text-sm text-muted-foreground">
            Все заказы по всем каналам продаж.
          </p>
        </div>
        <Link href={`/${org}/orders/new`}>
          <Button>Новый заказ</Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={search}
          placeholder="Поиск по номеру заказа или клиенту…"
          className="h-10 max-w-xs flex-1 rounded-md border border-border bg-surface px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={statusParam}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
        >
          <option value="ALL">Все статусы</option>
          {(Object.keys(STATUS_TONE) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Применить
        </Button>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          title="Заказов пока нет"
          description="Заказы с OLX или созданные вручную появятся здесь."
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>Заказ</Th>
            <Th>Клиент</Th>
            <Th>Источник</Th>
            <Th>Товары</Th>
            <Th>Сумма</Th>
            <Th>Статус</Th>
            <Th>Дата</Th>
          </DataTableHead>
          <DataTableBody>
            {orders.map((order) => (
              <tr key={order.id}>
                <Td>
                  <Link
                    href={`/${org}/orders/${order.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {order.orderNumber}
                  </Link>
                </Td>
                <Td className="text-muted-foreground">
                  {order.customer?.name ?? 'Разовый'}
                </Td>
                <Td className="text-muted-foreground">{ORDER_SOURCE_LABEL[order.source]}</Td>
                <Td>{order.items.length}</Td>
                <Td className="font-medium">
                  {formatCurrency(Number(order.total), organization.currency)}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                </Td>
                <Td className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                </Td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
