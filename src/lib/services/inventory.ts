import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import { evaluateInventoryAlerts } from '@/lib/services/alerts'
import type { InventoryTransactionType } from '@prisma/client'

const SALES_VELOCITY_WINDOW_DAYS = 30
const MIN_SALES_FOR_FORECAST = 3

export type StockHealth = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export function getStockHealth(
  physicalStock: number,
  minimumStock: number
): StockHealth {
  if (physicalStock <= 0) return 'OUT_OF_STOCK'
  if (physicalStock <= minimumStock) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export async function listInventory(organizationId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId, status: 'ACTIVE' },
    include: { inventory: true },
    orderBy: { name: 'asc' },
  })

  const since = new Date(Date.now() - SALES_VELOCITY_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const salesByProduct = await prisma.inventoryTransaction.groupBy({
    by: ['productId'],
    where: {
      organizationId,
      type: 'SALE',
      createdAt: { gte: since },
    },
    _sum: { quantity: true },
  })

  const salesMap = new Map(
    salesByProduct.map((s) => [s.productId, Math.abs(s._sum.quantity ?? 0)])
  )

  return products.map((product) => {
    const physicalStock = product.inventory?.physicalStock ?? 0
    const reservedStock = product.inventory?.reservedStock ?? 0
    const incomingStock = product.inventory?.incomingStock ?? 0
    const damagedStock = product.inventory?.damagedStock ?? 0
    const available = physicalStock - reservedStock

    const totalSoldInWindow = salesMap.get(product.id) ?? 0
    const avgDailySales = totalSoldInWindow / SALES_VELOCITY_WINDOW_DAYS

    const hasEnoughDataForForecast = totalSoldInWindow >= MIN_SALES_FOR_FORECAST
    const daysRemaining =
      hasEnoughDataForForecast && avgDailySales > 0
        ? physicalStock / avgDailySales
        : null

    return {
      product,
      physicalStock,
      reservedStock,
      incomingStock,
      damagedStock,
      available,
      health: getStockHealth(physicalStock, product.minimumStock),
      avgDailySales: hasEnoughDataForForecast ? avgDailySales : null,
      daysRemaining,
    }
  })
}

export async function getInventoryHistory(
  organizationId: string,
  productId: string,
  take = 50
) {
  return prisma.inventoryTransaction.findMany({
    where: { organizationId, productId },
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export async function adjustStock(
  context: MembershipContext,
  productId: string,
  input: {
    type: InventoryTransactionType
    quantity: number
    reason?: string
  }
) {
  requireRole(context, 'STAFF')

  if (input.quantity === 0) {
    throw new Error('Количество не должно быть равно нулю.')
  }

  const inventory = await prisma.inventory.findUnique({
    where: { productId },
  })
  if (!inventory) throw new Error('Запись об остатках для этого товара не найдена.')

  const signedQuantity = signForTransaction(input.type, input.quantity)
  const newPhysicalStock = inventory.physicalStock + signedQuantity

  if (newPhysicalStock < 0) {
    throw new Error('Эта корректировка приведёт к отрицательному остатку.')
  }

  await prisma.$transaction([
    prisma.inventory.update({
      where: { productId },
      data: { physicalStock: newPhysicalStock },
    }),
    prisma.inventoryTransaction.create({
      data: {
        organizationId: context.organizationId,
        productId,
        type: input.type,
        quantity: signedQuantity,
        reason: input.reason || null,
        userId: context.user.id,
      },
    }),
  ])

  await evaluateInventoryAlerts(context.organizationId)
}

function signForTransaction(type: InventoryTransactionType, quantity: number) {
  const positiveTypes: InventoryTransactionType[] = [
    'STOCK_IN',
    'RETURN',
    'ADJUSTMENT',
    'RELEASE',
  ]
  const absolute = Math.abs(quantity)
  if (type === 'ADJUSTMENT') return quantity // caller controls sign explicitly
  return positiveTypes.includes(type) ? absolute : -absolute
}
