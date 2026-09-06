import * as z from 'zod'

export const TRIGGER_OPTIONS = [
  'stock_zero',
  'stock_below_minimum',
  'listing_not_connected',
  'listing_price_mismatch',
  'sync_failed',
] as const

export const ACTION_OPTIONS = [
  'create_alert',
] as const

export const AutomationSchema = z.object({
  name: z.string().min(2, 'Введите название.').trim(),
  trigger: z.enum(TRIGGER_OPTIONS),
  action: z.enum(ACTION_OPTIONS),
})
