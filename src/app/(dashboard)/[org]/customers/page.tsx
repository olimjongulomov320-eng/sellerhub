import Link from 'next/link'
import { requireOrgContext } from '@/lib/services/organization'
import { listCustomers } from '@/lib/services/customers'
import { prisma } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/dashboard/empty-state'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
} from '@/components/shared/data-table'
import { formatCurrency } from '@/lib/utils/format'

export default async function CustomersPage(
  props: PageProps<'/[org]/customers'>
) {
  const { org } = await props.params
  const searchParams = await props.searchParams
  const context = await requireOrgContext(org)
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined

  const [customers, organization] = await Promise.all([
    listCustomers(context.organizationId, search),
    prisma.organization.findUniqueOrThrow({
      where: { id: context.organizationId },
      select: { currency: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Клиенты</h1>
          <p className="text-sm text-muted-foreground">
            Отношения с клиентами и история покупок.
          </p>
        </div>
        <Link href={`/${org}/customers/new`}>
          <Button>Добавить клиента</Button>
        </Link>
      </div>

      <form className="flex gap-3">
        <Input name="q" defaultValue={search} placeholder="Поиск по имени, телефону или email…" className="max-w-xs" />
        <Button type="submit" variant="secondary">
          Найти
        </Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title="Клиентов пока нет"
          description="Клиенты добавляются автоматически из заказов, либо вы можете добавить их вручную."
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>Имя</Th>
            <Th>Контакты</Th>
            <Th>Заказы</Th>
            <Th>Всего потрачено</Th>
            <Th>Средний чек</Th>
            <Th>Последний заказ</Th>
          </DataTableHead>
          <DataTableBody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <Td>
                  <Link
                    href={`/${org}/customers/${customer.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {customer.name}
                  </Link>
                </Td>
                <Td className="text-muted-foreground">
                  {customer.phone || customer.email || '—'}
                </Td>
                <Td>{customer.orderCount}</Td>
                <Td>{formatCurrency(customer.totalSpent, organization.currency)}</Td>
                <Td>{formatCurrency(customer.averageOrder, organization.currency)}</Td>
                <Td className="text-muted-foreground">
                  {customer.lastOrderAt
                    ? new Date(customer.lastOrderAt).toLocaleDateString('ru-RU')
                    : '—'}
                </Td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
