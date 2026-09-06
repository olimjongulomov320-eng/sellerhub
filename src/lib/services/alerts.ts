import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'

export async function listAlerts(organizationId: string, unreadOnly = false) {
  return prisma.alert.findMany({
    where: { organizationId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function markAlertRead(context: MembershipContext, alertId: string) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, organizationId: context.organizationId },
  })
  if (!alert) return
  await prisma.alert.update({ where: { id: alertId }, data: { isRead: true } })
}

export async function markAllAlertsRead(context: MembershipContext) {
  await prisma.alert.updateMany({
    where: { organizationId: context.organizationId, isRead: false },
    data: { isRead: true },
  })
}

/**
 * Scans current org state for conditions worth alerting on and creates
 * Alert rows for anything not already flagged. Designed to be safe to call
 * repeatedly (e.g. on a schedule or after relevant mutations) — it only
 * creates an alert for a given entity if an unresolved one doesn't already
 * exist, so it never spams duplicates.
 */
export async function evaluateInventoryAlerts(organizationId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId, status: 'ACTIVE' },
    include: { inventory: true },
  })

  let created = 0

  for (const product of products) {
    const stock = product.inventory?.physicalStock ?? 0

    const existingUnread = await prisma.alert.findFirst({
      where: {
        organizationId,
        entityType: 'Product',
        entityId: product.id,
        isRead: false,
        type: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] },
      },
    })
    if (existingUnread) continue

    if (stock <= 0) {
      await prisma.alert.create({
        data: {
          organizationId,
          type: 'OUT_OF_STOCK',
          severity: 'CRITICAL',
          title: `${product.name}: нет в наличии`,
          message: `${product.name} (артикул ${product.sku}) — остаток 0 единиц.`,
          entityType: 'Product',
          entityId: product.id,
        },
      })
      created += 1
    } else if (stock <= product.minimumStock) {
      await prisma.alert.create({
        data: {
          organizationId,
          type: 'LOW_STOCK',
          severity: 'WARNING',
          title: `${product.name}: мало на складе`,
          message: `${product.name} (артикул ${product.sku}) — осталось ${stock} ед. (минимум: ${product.minimumStock}).`,
          entityType: 'Product',
          entityId: product.id,
        },
      })
      created += 1
    }
  }

  return created
}
