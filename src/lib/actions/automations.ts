'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgContext } from '@/lib/services/organization'
import {
  createAutomation,
  setAutomationStatus,
  runAutomations,
} from '@/lib/services/automations'
import { AutomationSchema } from '@/lib/validation/automation'

export type AutomationFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export async function createAutomationAction(
  _state: AutomationFormState,
  formData: FormData
): Promise<AutomationFormState> {
  const org = String(formData.get('org'))
  const context = await requireOrgContext(org)

  const validated = AutomationSchema.safeParse({
    name: formData.get('name'),
    trigger: formData.get('trigger'),
    action: formData.get('action'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  await createAutomation(context, validated.data)
  revalidatePath(`/${org}/automations`)
  return undefined
}

export async function toggleAutomationAction(
  org: string,
  automationId: string,
  currentStatus: 'ACTIVE' | 'PAUSED'
) {
  const context = await requireOrgContext(org)
  await setAutomationStatus(
    context,
    automationId,
    currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
  )
  revalidatePath(`/${org}/automations`)
}

export async function runAutomationsNowAction(org: string) {
  const context = await requireOrgContext(org)
  const count = await runAutomations(context.organizationId)
  revalidatePath(`/${org}/automations`)
  revalidatePath(`/${org}/alerts`)
  return count
}
