import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import type { ProductFormValues } from '@/lib/validation/product'
import { Prisma } from '@prisma/client'

export type ProductListFilters = {
  search?: string
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'ALL'
}

export async function listProducts(
  organizationId: string,
  filters: ProductListFilters = {}
) {
  const where: Prisma.ProductWhereInput = { organizationId }

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { brand: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return prisma.product.findMany({
    where,
    include: { inventory: true, category: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProduct(organizationId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, organizationId },
    include: {
      inventory: true,
      category: true,
      supplier: true,
      images: { orderBy: { position: 'asc' } },
      listings: { include: { marketplace: true } },
    },
  })
}

async function assertSkuAvailable(
  organizationId: string,
  sku: string,
  excludeProductId?: string
) {
  const existing = await prisma.product.findFirst({
    where: {
      organizationId,
      sku,
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { id: true },
  })
  if (existing) {
    throw new Error(`Артикул «${sku}» уже используется.`)
  }
}

function normalize(values: ProductFormValues) {
  return {
    sku: values.sku,
    name: values.name,
    description: values.description || null,
    categoryId: values.categoryId || null,
    brand: values.brand || null,
    purchasePrice: values.purchasePrice,
    sellingPrice: values.sellingPrice,
    discountPrice:
      values.discountPrice === '' || values.discountPrice === undefined
        ? null
        : values.discountPrice,
    currency: values.currency,
    unit: values.unit,
    weight:
      values.weight === '' || values.weight === undefined
        ? null
        : values.weight,
    status: values.status,
    supplierId: values.supplierId || null,
    minimumStock: values.minimumStock,
  }
}

export async function createProduct(
  context: MembershipContext,
  values: ProductFormValues
) {
  requireRole(context, 'STAFF')
  await assertSkuAvailable(context.organizationId, values.sku)

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        organizationId: context.organizationId,
        ...normalize(values),
      },
    })

    await tx.inventory.create({
      data: {
        productId: created.id,
        physicalStock: values.initialStock,
      },
    })

    if (values.initialStock > 0) {
      await tx.inventoryTransaction.create({
        data: {
          organizationId: context.organizationId,
          productId: created.id,
          type: 'STOCK_IN',
          quantity: values.initialStock,
          reason: 'Начальный остаток при создании товара',
          userId: context.user.id,
        },
      })
    }

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'product.created',
        entityType: 'Product',
        entityId: created.id,
        newValue: { sku: created.sku, name: created.name },
      },
    })

    return created
  })

  return product
}

export async function updateProduct(
  context: MembershipContext,
  productId: string,
  values: ProductFormValues
) {
  requireRole(context, 'STAFF')

  const existing = await prisma.product.findFirst({
    where: { id: productId, organizationId: context.organizationId },
  })
  if (!existing) {
    throw new Error('Товар не найден.')
  }

  await assertSkuAvailable(context.organizationId, values.sku, productId)

  const updated = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: productId },
      data: normalize(values),
    })

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'product.updated',
        entityType: 'Product',
        entityId: product.id,
        oldValue: {
          sku: existing.sku,
          name: existing.name,
          sellingPrice: existing.sellingPrice.toString(),
          status: existing.status,
        },
        newValue: {
          sku: product.sku,
          name: product.name,
          sellingPrice: product.sellingPrice.toString(),
          status: product.status,
        },
      },
    })

    return product
  })

  return updated
}

export async function archiveProduct(
  context: MembershipContext,
  productId: string
) {
  requireRole(context, 'MANAGER')

  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId: context.organizationId },
  })
  if (!product) throw new Error('Товар не найден.')

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    }),
    prisma.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'product.archived',
        entityType: 'Product',
        entityId: productId,
        oldValue: { status: product.status },
        newValue: { status: 'ARCHIVED' },
      },
    }),
  ])
}

export async function duplicateProduct(
  context: MembershipContext,
  productId: string
) {
  requireRole(context, 'STAFF')

  const original = await prisma.product.findFirst({
    where: { id: productId, organizationId: context.organizationId },
  })
  if (!original) throw new Error('Товар не найден.')

  let candidateSku = `${original.sku}-copy`
  let suffix = 1
  while (
    await prisma.product.findFirst({
      where: { organizationId: context.organizationId, sku: candidateSku },
      select: { id: true },
    })
  ) {
    suffix += 1
    candidateSku = `${original.sku}-copy-${suffix}`
  }

  return prisma.$transaction(async (tx) => {
    const copy = await tx.product.create({
      data: {
        organizationId: context.organizationId,
        sku: candidateSku,
        name: `${original.name} (copy)`,
        description: original.description,
        categoryId: original.categoryId,
        brand: original.brand,
        purchasePrice: original.purchasePrice,
        sellingPrice: original.sellingPrice,
        discountPrice: original.discountPrice,
        currency: original.currency,
        unit: original.unit,
        weight: original.weight,
        status: 'DRAFT',
        supplierId: original.supplierId,
        minimumStock: original.minimumStock,
      },
    })

    await tx.inventory.create({ data: { productId: copy.id } })

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'product.duplicated',
        entityType: 'Product',
        entityId: copy.id,
        oldValue: { sourceProductId: original.id },
      },
    })

    return copy
  })
}

export async function deleteProduct(
  context: MembershipContext,
  productId: string
) {
  requireRole(context, 'ADMIN')

  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId: context.organizationId },
  })
  if (!product) throw new Error('Товар не найден.')

  const orderItemCount = await prisma.orderItem.count({
    where: { productId },
  })
  if (orderItemCount > 0) {
    throw new Error(
      'У этого товара есть история заказов, его нельзя удалить. Вместо этого архивируйте его.'
    )
  }

  await prisma.$transaction([
    prisma.product.delete({ where: { id: productId } }),
    prisma.activityLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.user.id,
        action: 'product.deleted',
        entityType: 'Product',
        entityId: productId,
        oldValue: { sku: product.sku, name: product.name },
      },
    }),
  ])
}
