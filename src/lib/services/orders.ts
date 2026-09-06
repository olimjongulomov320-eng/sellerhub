import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import { evaluateInventoryAlerts } from '@/lib/services/alerts'
import { Prisma, OrderStatus } from '@prisma/client'
import type { OrderSource } from '@prisma/client'

type OrderItemInput = {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
}

type CreateOrderInput = {
  customerId?: string
  customerName?: string
  source: OrderSource
  paymentMethod?: string
  deliveryMethod?: string
  deliveryAddress?: string
  notes?: string
  items: OrderItemInput[]
}

async function generateOrderNumber(organizationId: string) {
  const count = await prisma.order.count({ where: { organizationId } })
  const year = new Date().getFullYear()
  return `SH-${year}-${String(count + 1).padStart(5, '0')}`
}

export async function listOrders(
  organizationId: string,
  filters: { status?: OrderStatus | 'ALL'; search?: string } = {}
) {
  const where: Prisma.OrderWhereInput = { organizationId }

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status
  }

  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  return prisma.order.findMany({
    where,
    include: { customer: true, items: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrder(organizationId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, organizationId },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  })
}

export async function createOrder(
  context: MembershipContext,
  input: CreateOrderInput
) {
  requireRole(context, 'STAFF')

  if (input.items.length === 0) {
    throw new Error('В заказе должна быть хотя бы одна позиция.')
  }

  const productIds = input.items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId: context.organizationId },
    include: { inventory: true },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of input.items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new Error('Один или несколько товаров не найдены.')
    }
    const available =
      (product.inventory?.physicalStock ?? 0) - (product.inventory?.reservedStock ?? 0)
    if (available < item.quantity) {
      throw new Error(
        `Недостаточно остатка для «${product.name}». Доступно: ${available}, запрошено: ${item.quantity}.`
      )
    }
  }

  let subtotal = 0
  let totalCost = 0
  let totalDiscount = 0

  const itemsData = input.items.map((item) => {
    const product = productMap.get(item.productId)!
    const lineTotal = item.unitPrice * item.quantity - item.discount
    subtotal += item.unitPrice * item.quantity
    totalDiscount += item.discount
    totalCost += Number(product.purchasePrice) * item.quantity

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitCost: product.purchasePrice,
      discount: item.discount,
      total: lineTotal,
    }
  })

  const total = subtotal - totalDiscount
  const profit = total - totalCost

  const orderNumber = await generateOrderNumber(context.organizationId)

  let customerId = input.customerId || undefined
  if (!customerId && input.customerName) {
    const customer = await prisma.customer.create({
      data: {
        organizationId: context.organizationId,
        name: input.customerName,
        source: input.source,
      },
    })
    customerId = customer.id
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        organizationId: context.organizationId,
        orderNumber,
        customerId,
        status: 'NEW',
        source: input.source,
        subtotal,
        discount: totalDiscount,
        total,
        cost: totalCost,
        profit,
        paymentMethod: input.paymentMethod || null,
        deliveryMethod: input.deliveryMethod || null,
        deliveryAddress: input.deliveryAddress || null,
        notes: input.notes || null,
        items: { create: itemsData },
      },
      include: { items: true },
    })

    for (const item of input.items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { physicalStock: { decrement: item.quantity } },
      })
      await tx.inventoryTransaction.create({
        data: {
          organizationId: context.organizationId,
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          reference: created.orderNumber,
          userId: context.user.id,
        },
      })
    }

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'order.created',
        entityType: 'Order',
        entityId: created.id,
        newValue: { orderNumber: created.orderNumber, total: total.toString() },
      },
    })

    return created
  })

  await evaluateInventoryAlerts(context.organizationId)

  return order
}

const RESTOCKING_STATUSES: OrderStatus[] = ['CANCELLED', 'RETURNED']

export async function updateOrderStatus(
  context: MembershipContext,
  orderId: string,
  newStatus: OrderStatus
) {
  requireRole(context, 'STAFF')

  const order = await prisma.order.findFirst({
    where: { id: orderId, organizationId: context.organizationId },
    include: { items: true },
  })
  if (!order) throw new Error('Заказ не найден.')

  const wasRestocked = RESTOCKING_STATUSES.includes(order.status)
  const shouldRestock = RESTOCKING_STATUSES.includes(newStatus) && !wasRestocked

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    })

    if (shouldRestock) {
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { physicalStock: { increment: item.quantity } },
        })
        await tx.inventoryTransaction.create({
          data: {
            organizationId: context.organizationId,
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            reference: order.orderNumber,
            reason: `Order ${newStatus.toLowerCase()}`,
            userId: context.user.id,
          },
        })
      }
    }

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'order.status_changed',
        entityType: 'Order',
        entityId: orderId,
        oldValue: { status: order.status },
        newValue: { status: newStatus },
      },
    })
  })
}
