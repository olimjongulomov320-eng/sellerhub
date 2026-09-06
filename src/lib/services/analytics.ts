import 'server-only'

import { prisma } from '@/lib/db/client'

export type DateRangeKey = 'today' | '7d' | '30d' | '90d'

export function resolveDateRange(key: DateRangeKey): { since: Date; until: Date } {
  const until = new Date()
  const since = new Date()

  switch (key) {
    case 'today':
      since.setHours(0, 0, 0, 0)
      break
    case '7d':
      since.setDate(since.getDate() - 7)
      break
    case '30d':
      since.setDate(since.getDate() - 30)
      break
    case '90d':
      since.setDate(since.getDate() - 90)
      break
  }

  return { since, until }
}

const COMPLETED_STATUSES = ['COMPLETED', 'SHIPPED'] as const

export async function getAnalyticsSummary(
  organizationId: string,
  range: { since: Date; until: Date }
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      status: { in: [...COMPLETED_STATUSES] },
      createdAt: { gte: range.since, lte: range.until },
    },
    include: { items: { include: { product: true } } },
  })

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const profit = orders.reduce((sum, o) => sum + Number(o.profit), 0)
  const orderCount = orders.length
  const units = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  )
  const aov = orderCount > 0 ? revenue / orderCount : 0
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0

  const productTotals = new Map<string, { name: string; revenue: number; units: number }>()
  for (const order of orders) {
    for (const item of order.items) {
      const existing = productTotals.get(item.productId) ?? {
        name: item.product.name,
        revenue: 0,
        units: 0,
      }
      existing.revenue += Number(item.total)
      existing.units += item.quantity
      productTotals.set(item.productId, existing)
    }
  }

  const topProducts = Array.from(productTotals.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const inventoryValueAgg = await prisma.product.findMany({
    where: { organizationId, status: 'ACTIVE' },
    include: { inventory: true },
  })
  const inventoryValue = inventoryValueAgg.reduce(
    (sum, p) => sum + Number(p.purchasePrice) * (p.inventory?.physicalStock ?? 0),
    0
  )

  const olxListings = await prisma.listing.findMany({
    where: { organizationId, marketplace: { type: 'OLX' } },
  })
  const olxViews = olxListings.reduce((sum, l) => sum + (l.views ?? 0), 0)
  const olxLeads = olxListings.reduce((sum, l) => sum + (l.messagesCount ?? 0), 0)
  const hasOlxViewData = olxListings.some((l) => l.views !== null)

  return {
    revenue,
    profit,
    orderCount,
    units,
    aov,
    margin,
    topProducts,
    inventoryValue,
    olxViews: hasOlxViewData ? olxViews : null,
    olxLeads: hasOlxViewData ? olxLeads : null,
    olxConversion:
      hasOlxViewData && olxViews > 0 ? (orderCount / olxViews) * 100 : null,
    hasAnyData: orderCount > 0,
  }
}
