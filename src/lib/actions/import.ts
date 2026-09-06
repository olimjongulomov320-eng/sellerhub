'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgContext } from '@/lib/services/organization'
import {
  parseProductsCsv,
  commitProductImport,
  type ParsedProductRow,
} from '@/lib/services/import'

export type ImportState =
  | {
      stage: 'preview'
      validRows: ParsedProductRow[]
      errors: { rowNumber: number; message: string }[]
    }
  | {
      stage: 'done'
      imported: number
      failed: { rowNumber: number; message: string }[]
    }
  | { stage: 'error'; message: string }
  | undefined

export async function previewImportAction(
  _state: ImportState,
  formData: FormData
): Promise<ImportState> {
  const org = String(formData.get('org'))
  await requireOrgContext(org)

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { stage: 'error', message: 'Выберите CSV-файл.' }
  }

  const text = await file.text()
  const preview = parseProductsCsv(text)

  return {
    stage: 'preview',
    validRows: preview.validRows,
    errors: preview.errors,
  }
}

export async function confirmImportAction(
  org: string,
  rows: ParsedProductRow[]
): Promise<ImportState> {
  const context = await requireOrgContext(org)
  const result = await commitProductImport(context, rows)

  revalidatePath(`/${org}/products`)

  return { stage: 'done', imported: result.imported, failed: result.failed }
}
