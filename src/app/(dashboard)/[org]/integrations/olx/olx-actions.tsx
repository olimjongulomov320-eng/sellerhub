'use client'

import { useTransition, useState } from 'react'
import {
  connectOlxAction,
  disconnectOlxAction,
  triggerOlxSyncAction,
} from '@/lib/actions/integrations'
import { Button } from '@/components/ui/button'

export function OlxActions({
  org,
  isConnected,
}: {
  org: string
  isConnected: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {!isConnected ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await connectOlxAction(org)
              })
            }
          >
            {isPending ? 'Подключение…' : 'Подключить OLX'}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setMessage(null)
                  const result = await triggerOlxSyncAction(org)
                  if (result?.message) setMessage(result.message)
                })
              }
            >
              {isPending ? 'Синхронизация…' : 'Синхронизировать'}
            </Button>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await disconnectOlxAction(org)
                })
              }
            >
              Отключить
            </Button>
          </>
        )}
      </div>
      {message && <p className="text-sm text-danger">{message}</p>}
    </div>
  )
}
