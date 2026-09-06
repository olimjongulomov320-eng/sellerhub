'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgContext } from '@/lib/services/organization'
import { markAlertRead, markAllAlertsRead } from '@/lib/services/alerts'

export async function markAlertReadAction(org: string, alertId: string) {
  const context = await requireOrgContext(org)
  await markAlertRead(context, alertId)
  revalidatePath(`/${org}/alerts`)
}

export async function markAllAlertsReadAction(org: string) {
  const context = await requireOrgContext(org)
  await markAllAlertsRead(context)
  revalidatePath(`/${org}/alerts`)
}
