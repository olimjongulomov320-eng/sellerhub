'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { createOrder, updateOrderStatus } from '@/lib/services/orders'
import { CreateOrderSchema, UpdateOrderStatusSchema } from '@/lib/validation/order'
import type { OrderStatus } from '@prisma/client'

export type OrderFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export async function createOrderAction(
  _state: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const org = String(formData.get('org'))
  const context = await requireOrgContext(org)

  let items: unknown
  try {
    items = JSON.parse(String(formData.get('itemsJson') ?? '[]'))
  } catch {
    return { message: 'Некорректные позиции заказа.' }
  }

  const validated = CreateOrderSchema.safeParse({
    customerId: formData.get('customerId'),
    customerName: formData.get('customerName'),
    source: formData.get('source'),
    paymentMethod: formData.get('paymentMethod'),
    deliveryMethod: formData.get('deliveryMethod'),
    deliveryAddress: formData.get('deliveryAddress'),
    notes: formData.get('notes'),
    items,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  let orderId: string
  try {
    const order = await createOrder(context, validated.data)
    orderId = order.id
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка.' }
  }

  revalidatePath(`/${org}/orders`)
  redirect(`/${org}/orders/${orderId}`)
}

export async function updateOrderStatusAction(
  org: string,
  orderId: string,
  status: OrderStatus
) {
  const context = await requireOrgContext(org)
  const validated = UpdateOrderStatusSchema.safeParse({ status })
  if (!validated.success) {
    throw new Error('Некорректный статус.')
  }

  await updateOrderStatus(context, orderId, validated.data.status)
  revalidatePath(`/${org}/orders`)
  revalidatePath(`/${org}/orders/${orderId}`)
}
