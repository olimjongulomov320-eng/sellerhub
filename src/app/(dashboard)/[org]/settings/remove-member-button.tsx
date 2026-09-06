'use client'

import { useTransition } from 'react'
import { removeMemberAction } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'

export function RemoveMemberButton({
  org,
  membershipId,
}: {
  org: string
  membershipId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-danger hover:bg-danger/10"
      disabled={isPending}
      onClick={() => {
        if (!confirm('Удалить этого участника из магазина?')) return
        startTransition(() => removeMemberAction(org, membershipId))
      }}
    >
      Удалить
    </Button>
  )
}
