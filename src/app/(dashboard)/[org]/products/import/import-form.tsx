'use client'

import { useActionState, useState, useTransition } from 'react'
import { previewImportAction, confirmImportAction } from '@/lib/actions/import'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ParsedProductRow } from '@/lib/services/import'

export function ImportForm({ org }: { org: string }) {
  const [state, formAction, previewPending] = useActionState(
    previewImportAction,
    undefined
  )
  const [isConfirming, startConfirm] = useTransition()
  const [result, setResult] = useState<
    { imported: number; failed: { rowNumber: number; message: string }[] } | null
  >(null)

  if (result) {
    return (
      <Card>
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium">
            Импортировано строк: {result.imported}.
          </p>
          {result.failed.length > 0 && (
            <>
              <p className="text-sm text-danger">
                Не удалось импортировать строк: {result.failed.length}:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {result.failed.map((f) => (
                  <li key={f.rowNumber}>
                    Строка {f.rowNumber}: {f.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (state?.stage === 'preview') {
    async function handleConfirm(rows: ParsedProductRow[]) {
      startConfirm(async () => {
        const outcome = await confirmImportAction(org, rows)
        if (outcome?.stage === 'done') {
          setResult({ imported: outcome.imported, failed: outcome.failed })
        }
      })
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium">
              Готово к импорту строк: {state.validRows.length}.
            </p>
            {state.errors.length > 0 && (
              <>
                <p className="mt-2 text-sm text-danger">
                  Строк с ошибками (будут пропущены): {state.errors.length}:
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                  {state.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>
                      Строка {e.rowNumber}: {e.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
        <Button
          disabled={state.validRows.length === 0 || isConfirming}
          onClick={() => handleConfirm(state.validRows)}
        >
          {isConfirming ? 'Импорт…' : `Импортировать строк: ${state.validRows.length}`}
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="org" value={org} />
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          Обязательные столбцы CSV: <code>sku, name, purchasePrice, sellingPrice, currency</code>
          . Необязательные: <code>minimumStock, initialStock</code>.
        </p>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="text-sm"
        />
      </div>
      {state?.stage === 'error' && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
      <Button type="submit" disabled={previewPending}>
        {previewPending ? 'Чтение файла…' : 'Предпросмотр импорта'}
      </Button>
    </form>
  )
}
