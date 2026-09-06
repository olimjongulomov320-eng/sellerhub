import { prisma } from '@/lib/db/client'
import { requireOrgContext } from '@/lib/services/organization'
import {
  getDashboardSummary,
  getRecentOrders,
  getLowStockProducts,
} from '@/lib/services/dashboard'
import { MetricCard } from '@/components/dashboard/metric-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

export default async function DashboardPage(
  props: PageProps<'/[org]/dashboard'>
) {
  const { org } = await props.params
  const context = await requireOrgContext(org)

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: context.organizationId },
    select: { currency: true },
  })

  const [summary, recentOrders, lowStockProducts] = await Promise.all([
    getDashboardSummary(context.organizationId),
    getRecentOrders(context.organizationId),
    getLowStockProducts(context.organizationId),
  ])

  const currency = organization.currency

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-sm text-muted-foreground">
          Вот как обстоят дела у {context.organizationName}.
        </p>
      </div>

      {!summary.hasAnyData ? (
        <EmptyState
          title="Пока нет данных"
          description="Добавьте товары и подключите канал продаж, чтобы здесь появились показатели вашего бизнеса."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Выручка"
              value={formatCurrency(
                summary.revenue ? Number(summary.revenue) : null,
                currency
              )}
            />
            <MetricCard
              label="Прибыль"
              value={formatCurrency(
                summary.profit ? Number(summary.profit) : null,
                currency
              )}
            />
            <MetricCard label="Заказы" value={formatNumber(summary.orderCount)} />
            <MetricCard label="Продано единиц" value={formatNumber(summary.unitsSold)} />
            <MetricCard
              label="Активные объявления"
              value={formatNumber(summary.activeListingCount)}
            />
            <MetricCard
              label="Мало на складе"
              value={formatNumber(summary.lowStockCount)}
              tone={summary.lowStockCount > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Последние заказы</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Заказов пока нет.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex items-center justify-between py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-muted-foreground">
                            {order.customer?.name ?? 'Разовый покупатель'}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(Number(order.total), currency)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Мало на складе</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Сейчас нет товаров с низким запасом.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {lowStockProducts.map((product) => (
                      <li
                        key={product.id}
                        className="flex items-center justify-between py-3 text-sm"
                      >
                        <p className="font-medium">{product.name}</p>
                        <p className="text-warning">
                          {product.inventory?.physicalStock ?? 0} осталось
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ИИ-рекомендации</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Пока недостаточно данных.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
