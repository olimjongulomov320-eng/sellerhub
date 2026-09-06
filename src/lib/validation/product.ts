import * as z from 'zod'
import { ProductStatus } from '@prisma/client'

export const ProductSchema = z.object({
  sku: z.string().min(1, 'Введите артикул (SKU).').trim(),
  name: z.string().min(2, 'Название должно содержать не менее 2 символов.').trim(),
  description: z.string().trim().optional().or(z.literal('')),
  categoryId: z.string().trim().optional().or(z.literal('')),
  brand: z.string().trim().optional().or(z.literal('')),
  purchasePrice: z.coerce.number().min(0, 'Значение должно быть 0 или больше.'),
  sellingPrice: z.coerce.number().min(0, 'Значение должно быть 0 или больше.'),
  discountPrice: z.coerce.number().min(0).optional().or(z.literal('')),
  currency: z.string().min(3, 'Укажите валюту.').trim(),
  unit: z.string().trim().min(1).default('шт'),
  weight: z.coerce.number().min(0).optional().or(z.literal('')),
  status: z.enum(ProductStatus),
  supplierId: z.string().trim().optional().or(z.literal('')),
  minimumStock: z.coerce.number().int().min(0).default(0),
  initialStock: z.coerce.number().int().min(0).default(0),
})

export type ProductFormValues = z.infer<typeof ProductSchema>
