import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import type { AutomationStatus } from '@prisma/client'

export async function listAutomations(organizationId: string) {
  return prisma.automation.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAutomation(
  context: MembershipContext,
  values: { name: string; trigger: string; action: string }
) {
  requireRole(context, 'MANAGER')

  return prisma.automation.create({
    data: {
      organizationId: context.organizationId,
      name: values.name,
      trigger: values.trigger,
      action: values.action,
      createdById: context.user.id,
      status: 'ACTIVE',
    },
  })
}

export async function setAutomationStatus(
  context: MembershipContext,
  automationId: string,
  status: AutomationStatus
) {
  requireRole(context, 'MANAGER')

  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId: context.organizationId },
  })
  if (!automation) throw new Error('Автоматизация не найдена.')

  await prisma.automation.update({ where: { id: automationId }, data: { status } })
}

/**
 * Evaluates every ACTIVE automation for an organization against current
 * state and executes its action (currently only "create_alert" — automations
 * never perform marketplace-mutating actions without explicit user
 * confirmation elsewhere in the UI, per the "no unattended risky actions"
 * rule).
 */
export async function runAutomations(organizationId: string) {
  const automations = await prisma.automation.findMany({
    where: { organizationId, status: 'ACTIVE' },
  })

  let executed = 0

  for (const automation of automations) {
    const matches = await evaluateTrigger(organizationId, automation.trigger)
    if (matches.length === 0) continue

    for (const match of matches) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          organizationId,
          entityType: match.entityType,
          entityId: match.entityId,
          isRead: false,
          title: match.title,
        },
      })
      if (existingAlert) continue

      await prisma.alert.create({
        data: {
          organizationId,
          type: 'OTHER',
          severity: match.severity,
          title: match.title,
          message: match.message,
          entityType: match.entityType,
          entityId: match.entityId,
        },
      })
    }

    await prisma.automation.update({
      where: { id: automation.id },
      data: { lastExecutedAt: new Date() },
    })
    executed += 1
  }

  return executed
}

type TriggerMatch = {
  entityType: string
  entityId: string
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

async function evaluateTrigger(
  organizationId: string,
  trigger: string
): Promise<TriggerMatch[]> {
  switch (trigger) {
    case 'stock_zero': {
      const products = await prisma.product.findMany({
        where: { organizationId, status: 'ACTIVE', inventory: { physicalStock: { lte: 0 } } },
        include: { inventory: true },
      })
      return products.map((p) => ({
        entityType: 'Product',
        entityId: p.id,
        title: `${p.name}: нет в наличии`,
        message: `${p.name} (артикул ${p.sku}) — остаток 0 единиц.`,
        severity: 'CRITICAL',
      }))
    }

    case 'stock_below_minimum': {
      const products = await prisma.product.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: { inventory: true },
      })
      return products
        .filter(
          (p) =>
            p.inventory &&
            p.inventory.physicalStock > 0 &&
            p.inventory.physicalStock <= p.minimumStock
        )
        .map((p) => ({
          entityType: 'Product',
          entityId: p.id,
          title: `${p.name}: мало на складе`,
          message: `${p.name} (артикул ${p.sku}) — осталось ${p.inventory?.physicalStock} ед.`,
          severity: 'WARNING',
        }))
    }

    case 'listing_not_connected': {
      const products = await prisma.product.findMany({
        where: { organizationId, status: 'ACTIVE', listings: { none: {} } },
      })
      return products.map((p) => ({
        entityType: 'Product',
        entityId: p.id,
        title: `${p.name}: нет объявления на маркетплейсе`,
        message: `${p.name} (артикул ${p.sku}) не размещён ни на одном подключённом канале.`,
        severity: 'INFO',
      }))
    }

    case 'listing_price_mismatch': {
      const listings = await prisma.listing.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: { product: true },
      })
      return listings
        .filter((l) => Number(l.price) !== Number(l.product.sellingPrice))
        .map((l) => ({
          entityType: 'Listing',
          entityId: l.id,
          title: `Расхождение цены: ${l.product.name}`,
          message: `Цена в объявлении (${l.price}) отличается от цены товара (${l.product.sellingPrice}).`,
          severity: 'WARNING',
        }))
    }

    case 'sync_failed': {
      const failedJobs = await prisma.syncJob.findMany({
        where: { organizationId, status: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      return failedJobs.map((job) => ({
        entityType: 'SyncJob',
        entityId: job.id,
        title: `${job.provider} sync failed`,
        message: job.error ?? 'Sync job failed with an unknown error.',
        severity: 'WARNING',
      }))
    }

    default:
      return []
  }
}
