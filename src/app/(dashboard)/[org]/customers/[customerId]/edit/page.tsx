import { notFound } from 'next/navigation'
import { requireOrgContext } from '@/lib/services/organization'
import { getCustomer } from '@/lib/services/customers'
import { updateCustomerAction } from '@/lib/actions/customers'
import { CustomerForm } from '../../customer-form'

export default async function EditCustomerPage(
  props: PageProps<'/[org]/customers/[customerId]/edit'>
) {
  const { org, customerId } = await props.params
  const context = await requireOrgContext(org)
  const customer = await getCustomer(context.organizationId, customerId)

  if (!customer) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Изменить клиента</h1>
      </div>
      <CustomerForm
        action={updateCustomerAction}
        org={org}
        customerId={customerId}
        submitLabel="Сохранить изменения"
        defaults={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
          tags: customer.tags,
        }}
      />
    </div>
  )
}
