'use client'

import { useTransition, useState } from 'react'
import { runAutomationsNowAction } from '@/lib/actions/automations'
import { Button } from '@/components/ui/button'

export function RunNowButton({ org }: { org: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<number | null>(null)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const count = await runAutomationsNowAction(org)
            setResult(count)
          })
        }
      >
        {isPending ? 'Выполнение…' : 'Запустить сейчас'}
      </Button>
      {result !== null && (
        <span className="text-xs text-muted-foreground">
          Сработавших правил: {result}
        </span>
      )}
    </div>
  )
}
