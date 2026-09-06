'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import type { CustomerFormState } from '@/lib/actions/customers'

export function CustomerForm({
  action,
  org,
  customerId,
  defaults,
  submitLabel,
}: {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>
  org: string
  customerId?: string
  defaults?: {
    name?: string
    phone?: string | null
    email?: string | null
    notes?: string | null
    tags?: string[]
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <input type="hidden" name="org" value={org} />
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <div>
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" defaultValue={defaults?.name} required />
        <FieldError messages={state?.errors?.name} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" defaultValue={defaults?.phone ?? ''} />
          <FieldError messages={state?.errors?.phone} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ''} />
          <FieldError messages={state?.errors?.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="tags">Теги (через запятую)</Label>
        <Input id="tags" name="tags" defaultValue={defaults?.tags?.join(', ') ?? ''} />
        <FieldError messages={state?.errors?.tags} />
      </div>
      <div>
        <Label htmlFor="notes">Заметки</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ''}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
        <FieldError messages={state?.errors?.notes} />
      </div>
      {state?.message && <p className="text-sm text-danger">{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Сохранение…' : submitLabel}
      </Button>
    </form>
  )
}
