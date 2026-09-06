import { requireOrgContext } from '@/lib/services/organization'
import { getIntegration } from '@/lib/services/integrations'
import { listSyncJobs } from '@/lib/sync/sync-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  INTEGRATION_STATUS_LABEL,
  LISTING_STATUS_LABEL,
  SYNC_JOB_STATUS_LABEL,
} from '@/lib/utils/labels'
import { OlxActions } from './olx-actions'

export default async function OlxIntegrationPage(
  props: PageProps<'/[org]/integrations/olx'>
) {
  const { org } = await props.params
  const context = await requireOrgContext(org)

  const [marketplace, syncJobs] = await Promise.all([
    getIntegration(context.organizationId, 'OLX'),
    listSyncJobs(context.organizationId, 10),
  ])

  const integration = marketplace?.integration
  const status = integration?.status ?? 'NOT_CONNECTED'
  const isConnected = status === 'CONNECTED'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">OLX</h1>
          <p className="text-sm text-muted-foreground">
            Синхронизируйте объявления, заказы и сообщения с аккаунтом OLX.
          </p>
        </div>
        <Badge
          tone={
            status === 'CONNECTED' ? 'success' : status === 'ERROR' ? 'danger' : 'default'
          }
        >
          {INTEGRATION_STATUS_LABEL[status]}
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {integration?.lastError && (
            <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              {integration.lastError}
            </div>
          )}

          {!isConnected && !integration?.lastError && (
            <p className="text-sm text-muted-foreground">
              Подключите аккаунт OLX для автоматической синхронизации объявлений и заказов.
            </p>
          )}

          <OlxActions org={org} isConnected={isConnected} />

          {integration?.lastSyncedAt && (
            <p className="text-xs text-muted-foreground">
              Последняя синхронизация: {new Date(integration.lastSyncedAt).toLocaleString('ru-RU')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Объявления</CardTitle>
        </CardHeader>
        <CardContent>
          {!marketplace || marketplace.listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isConnected
                ? 'Объявления ещё не синхронизированы.'
                : 'Подключите OLX, чтобы видеть здесь свои объявления.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {marketplace.listings.map((listing) => (
                <li key={listing.id} className="flex items-center justify-between py-3 text-sm">
                  <p className="font-medium">{listing.title}</p>
                  <Badge>{LISTING_STATUS_LABEL[listing.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История синхронизации</CardTitle>
        </CardHeader>
        <CardContent>
          {syncJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Синхронизаций пока не было.</p>
          ) : (
            <ul className="divide-y divide-border">
              {syncJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p>{new Date(job.createdAt).toLocaleString('ru-RU')}</p>
                    {job.error && (
                      <p className="text-xs text-danger">{job.error}</p>
                    )}
                  </div>
                  <Badge
                    tone={
                      job.status === 'COMPLETED'
                        ? 'success'
                        : job.status === 'FAILED'
                          ? 'danger'
                          : job.status === 'PARTIAL'
                            ? 'warning'
                            : 'default'
                    }
                  >
                    {SYNC_JOB_STATUS_LABEL[job.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
