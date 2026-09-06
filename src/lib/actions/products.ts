'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  duplicateProduct,
  deleteProduct,
} from '@/lib/services/products'
import { ProductSchema } from '@/lib/validation/product'

export type ProductFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

function parseProductForm(formData: FormData) {
  return ProductSchema.safeParse({
    sku: formData.get('sku'),
    name: formData.get('name'),
    description: formData.get('description') ?? undefined,
    categoryId: formData.get('categoryId') ?? undefined,
    brand: formData.get('brand') ?? undefined,
    purchasePrice: formData.get('purchasePrice'),
    sellingPrice: formData.get('sellingPrice'),
    discountPrice: formData.get('discountPrice') || undefined,
    currency: formData.get('currency'),
    unit: formData.get('unit'),
    weight: formData.get('weight') || undefined,
    status: formData.get('status'),
    supplierId: formData.get('supplierId') ?? undefined,
    minimumStock: formData.get('minimumStock'),
    initialStock: formData.get('initialStock'),
  })
}

export async function createProductAction(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const org = String(formData.get('org'))
  const context = await requireOrgContext(org)
  const validated = parseProductForm(formData)

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await createProduct(context, validated.data)
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка.' }
  }

  revalidatePath(`/${org}/products`)
  redirect(`/${org}/products`)
}

export async function updateProductAction(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const org = String(formData.get('org'))
  const productId = String(formData.get('productId'))
  const context = await requireOrgContext(org)
  const validated = parseProductForm(formData)

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await updateProduct(context, productId, validated.data)
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка.' }
  }

  revalidatePath(`/${org}/products`)
  revalidatePath(`/${org}/products/${productId}`)
  redirect(`/${org}/products/${productId}`)
}

export async function archiveProductAction(org: string, productId: string) {
  const context = await requireOrgContext(org)
  await archiveProduct(context, productId)
  revalidatePath(`/${org}/products`)
}

export async function duplicateProductAction(org: string, productId: string) {
  const context = await requireOrgContext(org)
  await duplicateProduct(context, productId)
  revalidatePath(`/${org}/products`)
}

export async function deleteProductAction(org: string, productId: string) {
  const context = await requireOrgContext(org)
  await deleteProduct(context, productId)
  revalidatePath(`/${org}/products`)
}
