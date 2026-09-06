'use client'

import { useActionState, useState, useMemo } from 'react'
import { createOrderAction } from '@/lib/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { formatCurrency } from '@/lib/utils/format'
import { Trash2 } from 'lucide-react'

type ProductOption = {
  id: string
  name: string
  sku: string
  sellingPrice: string
  available: number
}

type Customer = { id: string; name: string }

type LineItem = {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
}

export function NewOrderForm({
  org,
  products,
  customers,
  currency,
}: {
  org: string
  products: ProductOption[]
  customers: Customer[]
  currency: string
}) {
  const [state, formAction, pending] = useActionState(createOrderAction, undefined)
  const [items, setItems] = useState<LineItem[]>([])

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  function addItem() {
    if (products.length === 0) return
    const first = products[0]
    setItems((prev) => [
      ...prev,
      {
        productId: first.id,
        quantity: 1,
        unitPrice: Number(first.sellingPrice),
        discount: 0,
      },
    ])
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
    0
  )

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerId">Клиент (существующий)</Label>
          <select
            id="customerId"
            name="customerId"
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">— Разовый / новый —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="customerName">Или имя нового клиента</Label>
          <Input id="customerName" name="customerName" placeholder="Необязательно" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="source">Источник</Label>
          <select
            id="source"
            name="source"
            defaultValue="MANUAL"
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="MANUAL">Вручную</option>
            <option value="OLX">OLX</option>
            <option value="OTHER">Другое</option>
          </select>
        </div>
        <div>
          <Label htmlFor="paymentMethod">Способ оплаты</Label>
          <Input id="paymentMethod" name="paymentMethod" placeholder="Наличные, карта…" />
        </div>
        <div>
          <Label htmlFor="deliveryMethod">Способ доставки</Label>
          <Input id="deliveryMethod" name="deliveryMethod" placeholder="Самовывоз, курьер…" />
        </div>
      </div>

      <div>
        <Label htmlFor="deliveryAddress">Адрес доставки</Label>
        <Input id="deliveryAddress" name="deliveryAddress" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="mb-0">Товары</Label>
          <Button type="button" size="sm" variant="secondary" onClick={addItem}>
            Добавить товар
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Товары ещё не добавлены.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const product = productMap.get(item.productId)
              return (
                <div
                  key={index}
                  className="grid grid-cols-12 items-center gap-2 rounded-md border border-border p-2"
                >
                  <select
                    className="col-span-4 h-9 rounded-md border border-border bg-surface px-2 text-sm"
                    value={item.productId}
                    onChange={(e) => {
                      const p = productMap.get(e.target.value)
                      updateItem(index, {
                        productId: e.target.value,
                        unitPrice: p ? Number(p.sellingPrice) : item.unitPrice,
                      })
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (доступно: {p.available})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="col-span-2 h-9 rounded-md border border-border bg-surface px-2 text-sm"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: Number(e.target.value) })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="col-span-2 h-9 rounded-md border border-border bg-surface px-2 text-sm"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, { unitPrice: Number(e.target.value) })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Скидка"
                    className="col-span-2 h-9 rounded-md border border-border bg-surface px-2 text-sm"
                    value={item.discount}
                    onChange={(e) =>
                      updateItem(index, { discount: Number(e.target.value) })
                    }
                  />
                  <span className="col-span-1 text-sm">
                    {formatCurrency(
                      item.unitPrice * item.quantity - item.discount,
                      currency
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="col-span-1 flex justify-end text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  {product && item.quantity > product.available && (
                    <p className="col-span-12 text-xs text-danger">
                      Доступно только {product.available}.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <FieldError messages={state?.errors?.items} />
      </div>

      <div>
        <Label htmlFor="notes">Заметки</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">Промежуточный итог</p>
        <p className="text-lg font-semibold">{formatCurrency(subtotal, currency)}</p>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <Button type="submit" disabled={pending || items.length === 0}>
        {pending ? 'Создание заказа…' : 'Создать заказ'}
      </Button>
    </form>
  )
}
