'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import type { ProductFormState } from '@/lib/actions/products'

export type ProductDefaults = {
  sku?: string
  name?: string
  description?: string | null
  brand?: string | null
  purchasePrice?: string
  sellingPrice?: string
  discountPrice?: string | null
  currency?: string
  unit?: string
  weight?: string | null
  status?: string
  minimumStock?: number
}

export function ProductForm({
  action,
  org,
  productId,
  defaults,
  submitLabel,
  showInitialStock,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>
  org: string
  productId?: string
  defaults?: ProductDefaults
  submitLabel: string
  showInitialStock?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="org" value={org} />
      {productId && <input type="hidden" name="productId" value={productId} />}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Название товара</Label>
          <Input id="name" name="name" defaultValue={defaults?.name} required />
          <FieldError messages={state?.errors?.name} />
        </div>
        <div>
          <Label htmlFor="sku">Артикул (SKU)</Label>
          <Input id="sku" name="sku" defaultValue={defaults?.sku} required />
          <FieldError messages={state?.errors?.sku} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaults?.description ?? ''}
          rows={3}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
        <FieldError messages={state?.errors?.description} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Бренд</Label>
          <Input id="brand" name="brand" defaultValue={defaults?.brand ?? ''} />
          <FieldError messages={state?.errors?.brand} />
        </div>
        <div>
          <Label htmlFor="unit">Единица измерения</Label>
          <Input id="unit" name="unit" defaultValue={defaults?.unit ?? 'шт'} required />
          <FieldError messages={state?.errors?.unit} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="purchasePrice">Закупочная цена</Label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.purchasePrice}
            required
          />
          <FieldError messages={state?.errors?.purchasePrice} />
        </div>
        <div>
          <Label htmlFor="sellingPrice">Цена продажи</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.sellingPrice}
            required
          />
          <FieldError messages={state?.errors?.sellingPrice} />
        </div>
        <div>
          <Label htmlFor="discountPrice">Цена со скидкой</Label>
          <Input
            id="discountPrice"
            name="discountPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.discountPrice ?? ''}
          />
          <FieldError messages={state?.errors?.discountPrice} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="currency">Валюта</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={defaults?.currency ?? 'USD'}
            required
          />
          <FieldError messages={state?.errors?.currency} />
        </div>
        <div>
          <Label htmlFor="weight">Вес (кг)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.001"
            min="0"
            defaultValue={defaults?.weight ?? ''}
          />
          <FieldError messages={state?.errors?.weight} />
        </div>
        <div>
          <Label htmlFor="status">Статус</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'ACTIVE'}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="ACTIVE">Активен</option>
            <option value="DRAFT">Черновик</option>
            <option value="ARCHIVED">В архиве</option>
          </select>
          <FieldError messages={state?.errors?.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minimumStock">Минимальный запас (порог оповещения о низком остатке)</Label>
          <Input
            id="minimumStock"
            name="minimumStock"
            type="number"
            min="0"
            defaultValue={defaults?.minimumStock ?? 0}
            required
          />
          <FieldError messages={state?.errors?.minimumStock} />
        </div>
        {showInitialStock && (
          <div>
            <Label htmlFor="initialStock">Начальный остаток</Label>
            <Input
              id="initialStock"
              name="initialStock"
              type="number"
              min="0"
              defaultValue={0}
            />
            <FieldError messages={state?.errors?.initialStock} />
          </div>
        )}
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Сохранение…' : submitLabel}
      </Button>
    </form>
  )
}
