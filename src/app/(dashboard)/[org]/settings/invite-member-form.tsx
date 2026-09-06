'use client'

import { useActionState } from 'react'
import { inviteMemberAction } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'

export function InviteMemberForm({ org }: { org: string }) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org" value={org} />
      <div>
        <Input name="email" type="email" placeholder="teammate@example.com" required />
        <FieldError messages={state?.errors?.email} />
      </div>
      <select
        name="role"
        defaultValue="STAFF"
        className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
      >
        <option value="ADMIN">Администратор</option>
        <option value="MANAGER">Менеджер</option>
        <option value="STAFF">Сотрудник</option>
        <option value="VIEWER">Наблюдатель</option>
      </select>
      <Button type="submit" disabled={pending}>
        {pending ? 'Добавление…' : 'Добавить участника'}
      </Button>
      {state?.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
    </form>
  )
}
