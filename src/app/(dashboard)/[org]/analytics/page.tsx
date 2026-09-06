import Link from 'next/link'
import { requireOrgContext } from '@/lib/services/organization'
import { getAnalyticsSummary, resolveDateRange, type DateRangeKey } from '@/lib/services/analytics'
import { prisma } from '@/lib/db/client'
import { MetricCard } from '@/components/dashboard/metric-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: '7d', label: '7 дней' },
  { key: '30d', label: '30 дней' },
  { key: '90d', label: '90 дней' },
]

export default async function AnalyticsPage(props: PageProps<'/[org]/analytics'>) {
  const { org } = await props.params
  const searchParams = await props.searchParams
  const context = await requireOrgContext(org)

  const rangeKey = (typeof searchParams.range === 'string' ? searchParams.range : '30d') as DateRangeKey
  const range = resolveDateRange(RANGES.some((r) => r.key === rangeKey) ? rangeKey : '30d')

  const [summary, organization] = await Promise.all([
    getAnalyticsSummary(context.organizationId, range),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  const currency = organization.currency

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Аналитика</h1>
          <p className="text-sm text-muted-foreground">
            Показатели за выбранный период.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/${org}/analytics?range=${r.key}`}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium',
                rangeKey === r.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!summary.hasAnyData ? (
        <EmptyState
          title="Пока нет данных"
          description="Завершите несколько заказов, чтобы увидеть аналитику за этот период."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="Выручка" value={formatCurrency(summary.revenue, currency)} />
            <MetricCard label="Прибыль" value={formatCurrency(summary.profit, currency)} />
            <MetricCard label="Заказы" value={formatNumber(summary.orderCount)} />
            <MetricCard label="Единицы" value={formatNumber(summary.units)} />
            <MetricCard label="Средний чек" value={formatCurrency(summary.aov, currency)} />
            <MetricCard label="Маржа" value={`${summary.margin.toFixed(1)}%`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Стоимость запасов" value={formatCurrency(summary.inventoryValue, currency)} />
            <MetricCard
              label="Просмотры OLX"
              value={summary.olxViews !== null ? formatNumber(summary.olxViews) : 'Пока нет данных'}
            />
            <MetricCard
              label="Конверсия OLX"
              value={summary.olxConversion !== null ? `${summary.olxConversion.toFixed(1)}%` : 'Пока нет данных'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Топ товаров</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Продаж за этот период не было.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {summary.topProducts.map((p) => (
                    <li key={p.productId} className="flex items-center justify-between py-3 text-sm">
                      <p className="font-medium">{p.name}</p>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Единиц: {p.units}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(p.revenue, currency)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
