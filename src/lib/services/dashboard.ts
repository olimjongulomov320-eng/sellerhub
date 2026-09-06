import 'server-only'

import { prisma } from '@/lib/db/client'
import { OrderStatus } from '@prisma/client'

const COMPLETED_STATUSES: OrderStatus[] = ['COMPLETED', 'SHIPPED']

export async function getDashboardSummary(organizationId: string) {
  const [orderAgg, productCount, listingCount, activeProducts] =
    await Promise.all([
      prisma.order.aggregate({
        where: { organizationId, status: { in: COMPLETED_STATUSES } },
        _sum: { total: true, profit: true },
        _count: true,
      }),
      prisma.product.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      prisma.listing.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      prisma.product.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { minimumStock: true, inventory: { select: { physicalStock: true } } },
      }),
    ])

  const lowStockCount = activeProducts.filter(
    (p) => p.inventory && p.inventory.physicalStock <= p.minimumStock
  ).length

  const unitsSoldAgg = await prisma.orderItem.aggregate({
    where: {
      order: { organizationId, status: { in: COMPLETED_STATUSES } },
    },
    _sum: { quantity: true },
  })

  return {
    revenue: orderAgg._sum.total,
    profit: orderAgg._sum.profit,
    orderCount: orderAgg._count,
    unitsSold: unitsSoldAgg._sum.quantity ?? 0,
    activeProductCount: productCount,
    activeListingCount: listingCount,
    lowStockCount,
    hasAnyData: orderAgg._count > 0 || productCount > 0,
  }
}

export async function getRecentOrders(organizationId: string, take = 5) {
  return prisma.order.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take,
    include: { customer: true },
  })
}

export async function getLowStockProducts(organizationId: string, take = 5) {
  const products = await prisma.product.findMany({
    where: { organizationId, status: 'ACTIVE' },
    include: { inventory: true },
    take: 50,
  })

  return products
    .filter(
      (p) => p.inventory && p.inventory.physicalStock <= p.minimumStock
    )
    .slice(0, take)
}
