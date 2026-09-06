import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'
import type { MarketplaceType } from '@prisma/client'

export async function getIntegration(organizationId: string, type: MarketplaceType) {
  const marketplace = await prisma.marketplace.findUnique({
    where: { organizationId_type: { organizationId, type } },
    include: {
      integration: true,
      listings: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  return marketplace
}

/**
 * Records that a user attempted to connect OLX. This does NOT perform a
 * real OAuth handshake — SellerHub has no OLX API credentials yet. It
 * creates the Marketplace/Integration rows in a NOT_CONNECTED/ERROR state
 * so the rest of the system (UI, sync engine) has something concrete to
 * point at, and is explicit with the user about why nothing actually
 * connected.
 */
export async function requestOlxConnection(context: MembershipContext) {
  requireRole(context, 'ADMIN')

  const marketplace = await prisma.marketplace.upsert({
    where: {
      organizationId_type: { organizationId: context.organizationId, type: 'OLX' },
    },
    update: {},
    create: {
      organizationId: context.organizationId,
      type: 'OLX',
      name: 'OLX',
    },
  })

  await prisma.integration.upsert({
    where: { marketplaceId: marketplace.id },
    update: {
      status: 'ERROR',
      lastError:
        'Учётные данные OLX API пока не настроены. Для реального подключения нужен официальный доступ к OLX API.',
    },
    create: {
      organizationId: context.organizationId,
      marketplaceId: marketplace.id,
      status: 'ERROR',
      lastError:
        'Учётные данные OLX API пока не настроены. Для реального подключения нужен официальный доступ к OLX API.',
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.user.id,
      action: 'integration.connect_attempted',
      entityType: 'Integration',
      entityId: marketplace.id,
      newValue: { provider: 'OLX' },
    },
  })
}

export async function disconnectIntegration(
  context: MembershipContext,
  type: MarketplaceType
) {
  requireRole(context, 'ADMIN')

  const marketplace = await prisma.marketplace.findUnique({
    where: { organizationId_type: { organizationId: context.organizationId, type } },
  })
  if (!marketplace) return

  await prisma.integration.update({
    where: { marketplaceId: marketplace.id },
    data: { status: 'DISCONNECTED', accessToken: null, refreshToken: null },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.user.id,
      action: 'integration.disconnected',
      entityType: 'Integration',
      entityId: marketplace.id,
      newValue: { provider: type },
    },
  })
}
