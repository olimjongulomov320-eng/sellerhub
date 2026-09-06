'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Bell } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/dashboard/command-palette'

type OrgOption = { slug: string; name: string }

export function Topbar({
  currentOrg,
  orgOptions,
  userName,
}: {
  currentOrg: string
  orgOptions: OrgOption[]
  userName: string | null
}) {
  const router = useRouter()
  const [isSigningOut, startSignOut] = useTransition()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        {orgOptions.length > 1 ? (
          <select
            defaultValue={currentOrg}
            className="h-8 rounded-md border border-border bg-surface px-2 text-sm"
            onChange={(e) => {
              router.push(`/${e.target.value}/dashboard`)
            }}
          >
            {orgOptions.map((org) => (
              <option key={org.slug} value={org.slug}>
                {org.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium">
            {orgOptions[0]?.name ?? currentOrg}
          </span>
        )}
      </div>

      <CommandPalette orgSlug={currentOrg} />

      <div className="flex items-center gap-3">
        <button
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          aria-label="Уведомления"
        >
          <Bell className="size-4" />
        </button>
        <span className="text-sm text-muted-foreground">{userName}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isSigningOut}
          onClick={() => startSignOut(() => signOut())}
        >
          {isSigningOut ? 'Выход…' : 'Выйти'}
        </Button>
      </div>
    </header>
  )
}
