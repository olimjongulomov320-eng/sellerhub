import 'server-only'

import { prisma } from '@/lib/db/client'
import type { MembershipContext } from '@/lib/auth/dal'
import { requireRole } from '@/lib/auth/dal'

export type ParsedProductRow = {
  rowNumber: number
  sku: string
  name: string
  purchasePrice: number
  sellingPrice: number
  currency: string
  minimumStock: number
  initialStock: number
}

export type ImportRowError = { rowNumber: number; message: string }

export type ImportPreview = {
  validRows: ParsedProductRow[]
  errors: ImportRowError[]
  duplicateSkusInFile: string[]
}

const REQUIRED_HEADERS = [
  'sku',
  'name',
  'purchasePrice',
  'sellingPrice',
  'currency',
] as const

export function parseProductsCsv(csvText: string): ImportPreview {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { validRows: [], errors: [{ rowNumber: 0, message: 'Файл пуст.' }], duplicateSkusInFile: [] }
  }

  const headers = lines[0].split(',').map((h) => h.trim())
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    return {
      validRows: [],
      errors: [
        {
          rowNumber: 0,
          message: `Отсутствуют обязательные столбцы: ${missingHeaders.join(', ')}.`,
        },
      ],
      duplicateSkusInFile: [],
    }
  }

  const validRows: ParsedProductRow[] = []
  const errors: ImportRowError[] = []
  const seenSkus = new Map<string, number>()
  const duplicateSkusInFile: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1
    const cells = lines[i].split(',').map((c) => c.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })

    const sku = row.sku
    const name = row.name
    const purchasePrice = Number(row.purchasePrice)
    const sellingPrice = Number(row.sellingPrice)
    const currency = row.currency
    const minimumStock = row.minimumStock ? Number(row.minimumStock) : 0
    const initialStock = row.initialStock ? Number(row.initialStock) : 0

    if (!sku) {
      errors.push({ rowNumber, message: 'Не указан артикул (SKU).' })
      continue
    }
    if (!name) {
      errors.push({ rowNumber, message: 'Не указано название товара.' })
      continue
    }
    if (Number.isNaN(purchasePrice) || purchasePrice < 0) {
      errors.push({ rowNumber, message: 'Некорректная закупочная цена.' })
      continue
    }
    if (Number.isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push({ rowNumber, message: 'Некорректная цена продажи.' })
      continue
    }
    if (!currency || currency.length < 3) {
      errors.push({ rowNumber, message: 'Некорректная валюта.' })
      continue
    }

    if (seenSkus.has(sku)) {
      duplicateSkusInFile.push(sku)
      errors.push({ rowNumber, message: `Дублирующийся артикул «${sku}» в файле.` })
      continue
    }
    seenSkus.set(sku, rowNumber)

    validRows.push({
      rowNumber,
      sku,
      name,
      purchasePrice,
      sellingPrice,
      currency,
      minimumStock: Number.isNaN(minimumStock) ? 0 : minimumStock,
      initialStock: Number.isNaN(initialStock) ? 0 : initialStock,
    })
  }

  return { validRows, errors, duplicateSkusInFile }
}

export async function commitProductImport(
  context: MembershipContext,
  rows: ParsedProductRow[]
) {
  requireRole(context, 'STAFF')

  const existingSkus = await prisma.product.findMany({
    where: {
      organizationId: context.organizationId,
      sku: { in: rows.map((r) => r.sku) },
    },
    select: { sku: true },
  })
  const existingSkuSet = new Set(existingSkus.map((p) => p.sku))

  let imported = 0
  const failed: ImportRowError[] = []

  for (const row of rows) {
    if (existingSkuSet.has(row.sku)) {
      failed.push({ rowNumber: row.rowNumber, message: `Артикул «${row.sku}» уже существует.` })
      continue
    }

    try {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            organizationId: context.organizationId,
            sku: row.sku,
            name: row.name,
            purchasePrice: row.purchasePrice,
            sellingPrice: row.sellingPrice,
            currency: row.currency,
            minimumStock: row.minimumStock,
            status: 'ACTIVE',
          },
        })
        await tx.inventory.create({
          data: { productId: product.id, physicalStock: row.initialStock },
        })
      })
      imported += 1
    } catch (err) {
      failed.push({
        rowNumber: row.rowNumber,
        message: err instanceof Error ? err.message : 'Не удалось импортировать строку.',
      })
    }
  }

  await prisma.activityLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.user.id,
      action: 'product.imported',
      entityType: 'Product',
      newValue: { imported, failed: failed.length },
    },
  })

  return { imported, failed }
}
