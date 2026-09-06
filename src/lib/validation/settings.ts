import * as z from 'zod'

export const UpdateStoreSchema = z.object({
  name: z.string().min(2, 'Название магазина должно содержать не менее 2 символов.').trim(),
  country: z.string().min(2).trim(),
  currency: z.string().min(3).trim(),
})

export const InviteMemberSchema = z.object({
  email: z.email('Введите корректный email.').trim().toLowerCase(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
})
