'use client'

import { useActionState } from 'react'
import { createAutomationAction } from '@/lib/actions/automations'
import { TRIGGER_OPTIONS, ACTION_OPTIONS } from '@/lib/validation/automation'
import { AUTOMATION_TRIGGER_LABEL, AUTOMATION_ACTION_LABEL } from '@/lib/utils/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function AutomationForm({ org }: { org: string }) {
  const [state, formAction, pending] = useActionState(createAutomationAction, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org" value={org} />
      <div>
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" placeholder="Отслеживание низкого запаса" required />
        <FieldError messages={state?.errors?.name} />
      </div>
      <div>
        <Label htmlFor="trigger">Если…</Label>
        <select
          id="trigger"
          name="trigger"
          className="flex h-10 w-64 rounded-md border border-border bg-surface px-3 text-sm"
        >
          {TRIGGER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {AUTOMATION_TRIGGER_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="action">То…</Label>
        <select
          id="action"
          name="action"
          className="flex h-10 w-48 rounded-md border border-border bg-surface px-3 text-sm"
        >
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {AUTOMATION_ACTION_LABEL[a]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Создание…' : 'Создать правило'}
      </Button>
    </form>
  )
}
