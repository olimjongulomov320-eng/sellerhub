'use client'

import { useActionState } from 'react'
import { createOrganization } from '@/lib/actions/organization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

const COUNTRIES = [
  { code: 'UZ', name: 'Узбекистан' },
  { code: 'KZ', name: 'Казахстан' },
  { code: 'US', name: 'США' },
  { code: 'OTHER', name: 'Другая' },
]

const CURRENCIES = ['UZS', 'USD', 'EUR', 'KZT']

export function CreateStoreForm() {
  const [state, action, pending] = useActionState(createOrganization, undefined)

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="name">Название магазина</Label>
        <Input id="name" name="name" placeholder="Мой магазин" required />
        <FieldError messages={state?.errors?.name} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Страна</Label>
          <select
            id="country"
            name="country"
            required
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError messages={state?.errors?.country} />
        </div>

        <div>
          <Label htmlFor="currency">Валюта</Label>
          <select
            id="currency"
            name="currency"
            required
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError messages={state?.errors?.currency} />
        </div>
      </div>

      <div>
        <Label htmlFor="businessType">Тип бизнеса</Label>
        <select
          id="businessType"
          name="businessType"
          required
          defaultValue="INDIVIDUAL"
          className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <option value="INDIVIDUAL">Физическое лицо</option>
          <option value="COMPANY">Компания</option>
          <option value="OTHER">Другое</option>
        </select>
        <FieldError messages={state?.errors?.businessType} />
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Создание магазина…' : 'Создать магазин'}
      </Button>
    </form>
  )
}
