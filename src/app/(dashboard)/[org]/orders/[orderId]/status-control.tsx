'use client'

import { useTransition, useState } from 'react'
import { updateOrderStatusAction } from '@/lib/actions/orders'
import { ORDER_STATUS_LABEL } from '@/lib/utils/labels'
import type { OrderStatus } from '@prisma/client'

const STATUSES: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
  'RETURNED',
]

export function StatusControl({
  org,
  orderId,
  currentStatus,
}: {
  org: string
  orderId: string
  currentStatus: OrderStatus
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <select
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={(e) => {
          const status = e.target.value as OrderStatus
          setError(null)
          startTransition(async () => {
            try {
              await updateOrderStatusAction(org, orderId, status)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Не удалось обновить статус.')
            }
          })
        }}
        className="h-9 rounded-md border border-border bg-surface px-3 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
