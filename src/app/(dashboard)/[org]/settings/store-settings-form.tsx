'use client'

import { useActionState } from 'react'
import { updateStoreAction } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function StoreSettingsForm({
  org,
  defaults,
}: {
  org: string
  defaults: { name: string; country: string; currency: string }
}) {
  const [state, formAction, pending] = useActionState(updateStoreAction, undefined)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="org" value={org} />
      <div>
        <Label htmlFor="name">Название магазина</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required />
        <FieldError messages={state?.errors?.name} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Страна</Label>
          <Input id="country" name="country" defaultValue={defaults.country} required />
          <FieldError messages={state?.errors?.country} />
        </div>
        <div>
          <Label htmlFor="currency">Валюта</Label>
          <Input id="currency" name="currency" defaultValue={defaults.currency} required />
          <FieldError messages={state?.errors?.currency} />
        </div>
      </div>
      {state?.message && (
        <p className="text-sm text-muted-foreground">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Сохранение…' : 'Сохранить изменения'}
      </Button>
    </form>
  )
}
