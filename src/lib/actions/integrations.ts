'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgContext } from '@/lib/services/organization'
import {
  requestOlxConnection,
  disconnectIntegration,
} from '@/lib/services/integrations'
import { runSync } from '@/lib/sync/sync-service'

export async function connectOlxAction(org: string) {
  const context = await requireOrgContext(org)
  await requestOlxConnection(context)
  revalidatePath(`/${org}/integrations/olx`)
}

export async function disconnectOlxAction(org: string) {
  const context = await requireOrgContext(org)
  await disconnectIntegration(context, 'OLX')
  revalidatePath(`/${org}/integrations/olx`)
}

export async function triggerOlxSyncAction(org: string) {
  const context = await requireOrgContext(org)
  try {
    await runSync(context.organizationId, 'OLX', 'MANUAL')
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Синхронизация завершилась ошибкой.' }
  }
  revalidatePath(`/${org}/integrations/olx`)
  return { message: null }
}
