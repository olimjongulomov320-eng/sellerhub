import { requireOrgContext } from '@/lib/services/organization'
import { listInventory } from '@/lib/services/inventory'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
} from '@/components/shared/data-table'
import { AdjustStockForm } from './adjust-stock-form'

const HEALTH_LABEL: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  IN_STOCK: { label: 'В наличии', tone: 'success' },
  LOW_STOCK: { label: 'Мало на складе', tone: 'warning' },
  OUT_OF_STOCK: { label: 'Нет в наличии', tone: 'danger' },
}

export default async function InventoryPage(
  props: PageProps<'/[org]/inventory'>
) {
  const { org } = await props.params
  const context = await requireOrgContext(org)
  const rows = await listInventory(context.organizationId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Склад</h1>
        <p className="text-sm text-muted-foreground">
          Отслеживайте физический, зарезервированный и доступный запас по всем товарам.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Нет данных склада"
          description="Добавьте товары, чтобы начать отслеживать уровень запасов."
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>Товар</Th>
            <Th>Физически</Th>
            <Th>В резерве</Th>
            <Th>Доступно</Th>
            <Th>Статус</Th>
            <Th>Ост. дней (прогноз)</Th>
            <Th className="text-right">Действия</Th>
          </DataTableHead>
          <DataTableBody>
            {rows.map((row) => {
              const health = HEALTH_LABEL[row.health]
              return (
                <tr key={row.product.id}>
                  <Td>
                    <p className="font-medium">{row.product.name}</p>
                    <p className="text-xs text-muted-foreground">{row.product.sku}</p>
                  </Td>
                  <Td>{row.physicalStock}</Td>
                  <Td>{row.reservedStock}</Td>
                  <Td className="font-medium">{row.available}</Td>
                  <Td>
                    <Badge tone={health.tone}>{health.label}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {row.daysRemaining !== null
                      ? `${row.daysRemaining.toFixed(1)} дн.`
                      : 'Пока недостаточно данных'}
                  </Td>
                  <Td className="text-right">
                    <AdjustStockForm org={org} productId={row.product.id} />
                  </Td>
                </tr>
              )
            })}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
