import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import { Prisma } from '@prisma/client'

export async function listCustomers(organizationId: string, search?: string) {
  const where: Prisma.CustomerWhereInput = { organizationId }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      orders: { select: { total: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return customers.map((c) => {
    const orderCount = c.orders.length
    const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.total), 0)
    const lastOrder = c.orders.reduce<Date | null>((latest, o) => {
      return !latest || o.createdAt > latest ? o.createdAt : latest
    }, null)

    return {
      ...c,
      orderCount,
      totalSpent,
      averageOrder: orderCount > 0 ? totalSpent / orderCount : 0,
      lastOrderAt: lastOrder,
    }
  })
}

export async function getCustomer(organizationId: string, customerId: string) {
  return prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    include: {
      orders: {
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function createCustomer(
  context: MembershipContext,
  values: {
    name: string
    phone?: string
    email?: string
    notes?: string
    tags?: string
  }
) {
  requireRole(context, 'STAFF')

  return prisma.customer.create({
    data: {
      organizationId: context.organizationId,
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      notes: values.notes || null,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    },
  })
}

export async function updateCustomer(
  context: MembershipContext,
  customerId: string,
  values: {
    name: string
    phone?: string
    email?: string
    notes?: string
    tags?: string
  }
) {
  requireRole(context, 'STAFF')

  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: context.organizationId },
  })
  if (!existing) throw new Error('Клиент не найден.')

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      notes: values.notes || null,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    },
  })
}
