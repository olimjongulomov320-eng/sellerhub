'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgContext } from '@/lib/services/organization'
import {
  updateStoreSettings,
  inviteMemberByEmail,
  removeMember,
} from '@/lib/services/settings'
import { UpdateStoreSchema, InviteMemberSchema } from '@/lib/validation/settings'

export type SettingsFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export async function updateStoreAction(
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const org = String(formData.get('org'))
  const context = await requireOrgContext(org)

  const validated = UpdateStoreSchema.safeParse({
    name: formData.get('name'),
    country: formData.get('country'),
    currency: formData.get('currency'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  await updateStoreSettings(context, validated.data)
  revalidatePath(`/${org}/settings`)
  return { message: 'Настройки магазина сохранены.' }
}

export async function inviteMemberAction(
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const org = String(formData.get('org'))
  const context = await requireOrgContext(org)

  const validated = InviteMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await inviteMemberByEmail(context, validated.data.email, validated.data.role)
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка.' }
  }

  revalidatePath(`/${org}/settings`)
  return { message: 'Участник добавлен.' }
}

export async function removeMemberAction(org: string, membershipId: string) {
  const context = await requireOrgContext(org)
  await removeMember(context, membershipId)
  revalidatePath(`/${org}/settings`)
}
