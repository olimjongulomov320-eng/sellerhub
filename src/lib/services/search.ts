import 'server-only'

import { prisma } from '@/lib/db/client'

export type SearchResult = {
  type: 'product' | 'order' | 'customer' | 'listing'
  id: string
  title: string
  subtitle: string
  href: string
}

export async function globalSearch(
  organizationId: string,
  orgSlug: string,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const [products, orders, customers, listings] = await Promise.all([
    prisma.product.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        organizationId,
        orderNumber: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
    prisma.listing.findMany({
      where: {
        organizationId,
        title: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    }),
  ])

  return [
    ...products.map((p) => ({
      type: 'product' as const,
      id: p.id,
      title: p.name,
      subtitle: `SKU ${p.sku}`,
      href: `/${orgSlug}/products/${p.id}`,
    })),
    ...orders.map((o) => ({
      type: 'order' as const,
      id: o.id,
      title: o.orderNumber,
      subtitle: o.status,
      href: `/${orgSlug}/orders/${o.id}`,
    })),
    ...customers.map((c) => ({
      type: 'customer' as const,
      id: c.id,
      title: c.name,
      subtitle: c.phone ?? c.email ?? '',
      href: `/${orgSlug}/customers/${c.id}`,
    })),
    ...listings.map((l) => ({
      type: 'listing' as const,
      id: l.id,
      title: l.title,
      subtitle: l.status,
      href: `/${orgSlug}/listings`,
    })),
  ]
}
