import Link from 'next/link'
import { requireOrgContext } from '@/lib/services/organization'
import { getIntegration } from '@/lib/services/integrations'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { INTEGRATION_STATUS_LABEL } from '@/lib/utils/labels'

export default async function IntegrationsPage(
  props: PageProps<'/[org]/integrations'>
) {
  const { org } = await props.params
  const context = await requireOrgContext(org)
  const olx = await getIntegration(context.organizationId, 'OLX')

  const status = olx?.integration?.status ?? 'NOT_CONNECTED'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Интеграции</h1>
        <p className="text-sm text-muted-foreground">
          Подключайте каналы продаж для синхронизации объявлений и заказов.
        </p>
      </div>

      <Link href={`/${org}/integrations/olx`}>
        <Card className="transition-colors hover:border-border-strong">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium">OLX</p>
              <p className="text-sm text-muted-foreground">
                Объявления, заказы и сообщения маркетплейса.
              </p>
            </div>
            <Badge
              tone={
                status === 'CONNECTED'
                  ? 'success'
                  : status === 'ERROR'
                    ? 'danger'
                    : 'default'
              }
            >
              {INTEGRATION_STATUS_LABEL[status]}
            </Badge>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardContent className="flex items-center justify-between p-5 opacity-60">
          <div>
            <p className="font-medium">Uzum, Telegram, Instagram, Website</p>
            <p className="text-sm text-muted-foreground">Скоро.</p>
          </div>
          <Badge>Недоступно</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
