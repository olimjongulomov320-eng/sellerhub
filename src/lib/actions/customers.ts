'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { createCustomer, updateCustomer } from '@/lib/services/customers'
import { CustomerSchema } from '@/lib/validation/customer'

export type CustomerFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

function parseCustomerForm(formData: FormData) {
  return CustomerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    notes: formData.get('notes'),
    tags: formData.get('tags'),
  })
}

export async function createCustomerAction(
  _state: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const org = String(formData.get('org'))
  const context = await requireOrgContext(org)
  const validated = parseCustomerForm(formData)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const customer = await createCustomer(context, validated.data)
  revalidatePath(`/${org}/customers`)
  redirect(`/${org}/customers/${customer.id}`)
}

export async function updateCustomerAction(
  _state: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const org = String(formData.get('org'))
  const customerId = String(formData.get('customerId'))
  const context = await requireOrgContext(org)
  const validated = parseCustomerForm(formData)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await updateCustomer(context, customerId, validated.data)
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка.' }
  }

  revalidatePath(`/${org}/customers`)
  revalidatePath(`/${org}/customers/${customerId}`)
  redirect(`/${org}/customers/${customerId}`)
}
