import 'server-only'

import { prisma } from '@/lib/db/client'
import { getMarketplaceProvider } from '@/lib/marketplaces/registry'
import { MarketplaceNotSupportedError } from '@/lib/marketplaces/provider'
import type { MarketplaceType, SyncJobType } from '@prisma/client'

/**
 * Runs a sync job for one organization's marketplace integration:
 * pulls listings from the provider, normalizes them, and upserts into the
 * Listing table, recording progress on the SyncJob/SyncLog records as it
 * goes so failures are visible rather than silent.
 */
export async function runSync(
  organizationId: string,
  marketplaceType: MarketplaceType,
  type: SyncJobType = 'MANUAL'
) {
  const marketplace = await prisma.marketplace.findUnique({
    where: { organizationId_type: { organizationId, type: marketplaceType } },
    include: { integration: true },
  })

  if (!marketplace || !marketplace.integration) {
    throw new Error('Этот канал продаж пока не подключён.')
  }

  const job = await prisma.syncJob.create({
    data: {
      organizationId,
      provider: marketplaceType,
      type,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  const log = (message: string, level: 'info' | 'error' = 'info') =>
    prisma.syncLog.create({ data: { syncJobId: job.id, level, message } })

  const provider = getMarketplaceProvider(marketplaceType)
  const integration = marketplace.integration

  let itemsProcessed = 0
  let itemsCreated = 0
  let itemsUpdated = 0
  let itemsFailed = 0
  let finalStatus: 'COMPLETED' | 'PARTIAL' | 'FAILED' = 'COMPLETED'
  let topLevelError: string | null = null

  try {
    await log(`Запуск синхронизации (${type === 'MANUAL' ? 'вручную' : 'по расписанию'}) для ${marketplaceType}.`)

    const remoteListings = await provider.getListings({
      accessToken: integration.accessToken ?? '',
      refreshToken: integration.refreshToken ?? undefined,
      tokenExpiresAt: integration.tokenExpiresAt ?? undefined,
    })

    for (const remote of remoteListings) {
      itemsProcessed += 1
      try {
        const existing = await prisma.listing.findFirst({
          where: { marketplaceId: marketplace.id, externalId: remote.externalId },
        })

        if (existing) {
          await prisma.listing.update({
            where: { id: existing.id },
            data: {
              status: remote.status,
              url: remote.url,
              lastSyncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          })
          itemsUpdated += 1
        } else {
          itemsCreated += 1
        }
      } catch (err) {
        itemsFailed += 1
        await log(
          `Не удалось синхронизировать объявление ${remote.externalId}: ${
            err instanceof Error ? err.message : 'неизвестная ошибка'
          }`,
          'error'
        )
      }
    }

    if (itemsFailed > 0) {
      finalStatus = itemsCreated + itemsUpdated > 0 ? 'PARTIAL' : 'FAILED'
    }
  } catch (err) {
    if (err instanceof MarketplaceNotSupportedError) {
      topLevelError = err.message
      finalStatus = 'FAILED'
      await log(err.message, 'error')
    } else {
      topLevelError = err instanceof Error ? err.message : 'Неизвестная ошибка синхронизации.'
      finalStatus = 'FAILED'
      await log(topLevelError, 'error')
    }
  }

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status: finalStatus,
      finishedAt: new Date(),
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      itemsFailed,
      error: topLevelError,
    },
  })

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      lastSyncedAt: new Date(),
      lastError: topLevelError,
      status: topLevelError ? 'ERROR' : 'CONNECTED',
    },
  })

  if (topLevelError) {
    await prisma.alert.create({
      data: {
        organizationId,
        type: 'SYNC_ERROR',
        severity: 'WARNING',
        title: `Ошибка синхронизации ${marketplaceType}`,
        message: topLevelError,
        entityType: 'SyncJob',
        entityId: job.id,
      },
    })
  }

  return prisma.syncJob.findUniqueOrThrow({ where: { id: job.id } })
}

export async function listSyncJobs(organizationId: string, take = 20) {
  return prisma.syncJob.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take,
  })
}
