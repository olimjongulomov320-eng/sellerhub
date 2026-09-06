export function formatCurrency(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined) return '—'
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value.toLocaleString('ru-RU')} ${currency}`
  }
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('ru-RU').format(value)
}
