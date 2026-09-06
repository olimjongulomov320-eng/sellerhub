'use client'

import { useTransition } from 'react'
import { markAlertReadAction, markAllAlertsReadAction } from '@/lib/actions/alerts'
import { Button } from '@/components/ui/button'

export function MarkReadButton({ org, alertId }: { org: string; alertId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => markAlertReadAction(org, alertId))}
    >
      Отметить прочитанным
    </Button>
  )
}

export function MarkAllReadButton({ org }: { org: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => markAllAlertsReadAction(org))}
    >
      Отметить все прочитанными
    </Button>
  )
}
