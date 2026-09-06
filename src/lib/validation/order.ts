import * as z from 'zod'
import { OrderStatus, OrderSource } from '@prisma/client'

export const OrderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
})

export const CreateOrderSchema = z.object({
  customerId: z.string().trim().optional().or(z.literal('')),
  customerName: z.string().trim().optional().or(z.literal('')),
  source: z.enum(OrderSource).default('MANUAL'),
  paymentMethod: z.string().trim().optional().or(z.literal('')),
  deliveryMethod: z.string().trim().optional().or(z.literal('')),
  deliveryAddress: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  items: z.array(OrderItemInputSchema).min(1, 'Добавьте хотя бы одну позицию.'),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
})
