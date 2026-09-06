import { requireOrgContext } from '@/lib/services/organization'
import { ImportForm } from './import-form'

export default async function ImportProductsPage(
  props: PageProps<'/[org]/products/import'>
) {
  const { org } = await props.params
  await requireOrgContext(org)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Импорт товаров</h1>
        <p className="text-sm text-muted-foreground">
          Загрузите CSV-файл для массового добавления товаров.
        </p>
      </div>
      <ImportForm org={org} />
    </div>
  )
}
