'use client'

import { useActionState, useState } from 'react'
import { adjustStockAction } from '@/lib/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function AdjustStockForm({
  org,
  productId,
}: {
  org: string
  productId: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(adjustStockAction, undefined)

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Скорректировать запас
      </Button>
    )
  }

  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="org" value={org} />
        <input type="hidden" name="productId" value={productId} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`type-${productId}`}>Тип</Label>
            <select
              id={`type-${productId}`}
              name="type"
              className="flex h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"
            >
              <option value="STOCK_IN">Приход</option>
              <option value="STOCK_OUT">Расход</option>
              <option value="DAMAGE">Порча</option>
              <option value="RETURN">Возврат</option>
              <option value="ADJUSTMENT">Корректировка (+/-)</option>
            </select>
          </div>
          <div>
            <Label htmlFor={`quantity-${productId}`}>Количество</Label>
            <Input
              id={`quantity-${productId}`}
              name="quantity"
              type="number"
              required
            />
            <FieldError messages={state?.errors?.quantity} />
          </div>
        </div>
        <div>
          <Label htmlFor={`reason-${productId}`}>Причина (необязательно)</Label>
          <Input id={`reason-${productId}`} name="reason" />
        </div>
        {state?.message && (
          <p className="text-xs text-muted-foreground">{state.message}</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}
