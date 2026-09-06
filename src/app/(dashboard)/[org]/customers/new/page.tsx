import { requireOrgContext } from '@/lib/services/organization'
import { createCustomerAction } from '@/lib/actions/customers'
import { CustomerForm } from '../customer-form'

export default async function NewCustomerPage(
  props: PageProps<'/[org]/customers/new'>
) {
  const { org } = await props.params
  await requireOrgContext(org)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Добавить клиента</h1>
      </div>
      <CustomerForm action={createCustomerAction} org={org} submitLabel="Создать клиента" />
    </div>
  )
}
