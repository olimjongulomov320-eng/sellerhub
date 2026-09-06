import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { getCustomer } from '@/lib/services/customers'
import { prisma } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { ORDER_STATUS_LABEL } from '@/lib/utils/labels'

export default async function CustomerDetailPage(
  props: PageProps<'/[org]/customers/[customerId]'>
) {
  const { org, customerId } = await props.params
  const context = await requireOrgContext(org)

  const [customer, organization] = await Promise.all([
    getCustomer(context.organizationId, customerId),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  if (!customer) notFound()

  const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {customer.phone || customer.email || 'Нет контактных данных'}
          </p>
        </div>
        <Link href={`/${org}/customers/${customer.id}/edit`}>
          <Button variant="secondary">Изменить</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Заказы</p>
            <p className="mt-1.5 text-xl font-semibold">{customer.orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Всего потрачено</p>
            <p className="mt-1.5 text-xl font-semibold">
              {formatCurrency(totalSpent, organization.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Теги</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {customer.tags.length > 0 ? (
                customer.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Заметки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Заказов пока нет.</p>
          ) : (
            <ul className="divide-y divide-border">
              {customer.orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground">
                      Товаров: {order.items.length} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{ORDER_STATUS_LABEL[order.status]}</Badge>
                    <span className="font-medium">
                      {formatCurrency(Number(order.total), organization.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
