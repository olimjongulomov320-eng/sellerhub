import * as z from 'zod'
import { BusinessType } from '@prisma/client'

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Название магазина должно содержать не менее 2 символов.').trim(),
  country: z.string().min(2, 'Выберите страну.').trim(),
  currency: z.string().min(3, 'Выберите валюту.').trim(),
  businessType: z.enum(BusinessType),
})
