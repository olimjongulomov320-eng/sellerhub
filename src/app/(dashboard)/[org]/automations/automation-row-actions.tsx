'use client'

import { useTransition } from 'react'
import { toggleAutomationAction } from '@/lib/actions/automations'
import { Button } from '@/components/ui/button'

export function ToggleAutomationButton({
  org,
  automationId,
  status,
}: {
  org: string
  automationId: string
  status: 'ACTIVE' | 'PAUSED'
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => toggleAutomationAction(org, automationId, status))
      }
    >
      {status === 'ACTIVE' ? 'Приостановить' : 'Активировать'}
    </Button>
  )
}
