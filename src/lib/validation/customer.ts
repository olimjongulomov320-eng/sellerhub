import * as z from 'zod'

export const CustomerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать не менее 2 символов.').trim(),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.email('Введите корректный email.').trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  tags: z.string().trim().optional().or(z.literal('')),
})
