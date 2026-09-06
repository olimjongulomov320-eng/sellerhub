'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgContext } from '@/lib/services/organization'
import { adjustStock } from '@/lib/services/inventory'
import { StockAdjustmentSchema } from '@/lib/validation/inventory'

export type InventoryFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export async function adjustStockAction(
  _state: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  const org = String(formData.get('org'))
  const productId = String(formData.get('productId'))
  const context = await requireOrgContext(org)

  const validated = StockAdjustmentSchema.safeParse({
    type: formData.get('type'),
    quantity: formData.get('quantity'),
    reason: formData.get('reason'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await adjustStock(context, productId, validated.data)
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка.' }
  }

  revalidatePath(`/${org}/inventory`)
  return { message: 'Остаток обновлён.' }
}
