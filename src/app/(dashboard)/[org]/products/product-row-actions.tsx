'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  archiveProductAction,
  duplicateProductAction,
  deleteProductAction,
} from '@/lib/actions/products'
import { Button } from '@/components/ui/button'

export function ProductRowActions({
  org,
  productId,
}: {
  org: string
  productId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/${org}/products/${productId}/edit`}>
        <Button variant="ghost" size="sm">
          Изменить
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            try {
              await duplicateProductAction(org, productId)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Не удалось дублировать товар.')
            }
          })
        }
      >
        Дублировать
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!confirm('Архивировать этот товар?')) return
          startTransition(async () => {
            setError(null)
            try {
              await archiveProductAction(org, productId)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Не удалось архивировать товар.')
            }
          })
        }}
      >
        В архив
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-danger hover:bg-danger/10"
        onClick={() => {
          if (!confirm('Удалить этот товар без возможности восстановления?'))
            return
          startTransition(async () => {
            setError(null)
            try {
              await deleteProductAction(org, productId)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Не удалось удалить товар.')
            }
          })
        }}
      >
        Удалить
      </Button>
      {error && (
        <span className="absolute mt-8 text-xs text-danger">{error}</span>
      )}
    </div>
  )
}
