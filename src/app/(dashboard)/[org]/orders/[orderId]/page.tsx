import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { getOrder } from '@/lib/services/orders'
import { prisma } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { ORDER_SOURCE_LABEL } from '@/lib/utils/labels'
import { StatusControl } from './status-control'

export default async function OrderDetailPage(
  props: PageProps<'/[org]/orders/[orderId]'>
) {
  const { org, orderId } = await props.params
  const context = await requireOrgContext(org)

  const [order, organization] = await Promise.all([
    getOrder(context.organizationId, orderId),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  if (!order) notFound()

  const currency = organization.currency

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.customer ? (
              <Link href={`/${org}/customers/${order.customer.id}`} className="hover:text-primary">
                {order.customer.name}
              </Link>
            ) : (
              'Разовый покупатель'
            )}
            {' · '}
            {new Date(order.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
        <StatusControl org={org} orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Сумма</p>
            <p className="mt-1.5 text-xl font-semibold">
              {formatCurrency(Number(order.total), currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Себестоимость</p>
            <p className="mt-1.5 text-xl font-semibold">
              {formatCurrency(Number(order.cost), currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Прибыль</p>
            <p className="mt-1.5 text-xl font-semibold">
              {formatCurrency(Number(order.profit), currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Источник</p>
            <p className="mt-1.5 text-xl font-semibold">{ORDER_SOURCE_LABEL[order.source]}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-muted-foreground">
                    {item.quantity} × {formatCurrency(Number(item.unitPrice), currency)}
                    {Number(item.discount) > 0 &&
                      ` − скидка ${formatCurrency(Number(item.discount), currency)}`}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(Number(item.total), currency)}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {(order.paymentMethod || order.deliveryMethod || order.deliveryAddress || order.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Детали</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {order.paymentMethod && (
              <div>
                <p className="text-muted-foreground">Оплата</p>
                <p>{order.paymentMethod}</p>
              </div>
            )}
            {order.deliveryMethod && (
              <div>
                <p className="text-muted-foreground">Доставка</p>
                <p>{order.deliveryMethod}</p>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Адрес</p>
                <p>{order.deliveryAddress}</p>
              </div>
            )}
            {order.notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Заметки</p>
                <p>{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
