import * as z from 'zod'
import { InventoryTransactionType } from '@prisma/client'

export const StockAdjustmentSchema = z.object({
  type: z.enum(InventoryTransactionType),
  quantity: z.coerce.number().int().refine((v) => v !== 0, 'Количество не должно быть равно нулю.'),
  reason: z.string().trim().optional().or(z.literal('')),
})
