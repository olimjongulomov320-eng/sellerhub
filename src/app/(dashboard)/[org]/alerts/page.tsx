import { requireOrgContext } from '@/lib/services/organization'
import { listAlerts } from '@/lib/services/alerts'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MarkReadButton, MarkAllReadButton } from './alert-actions'
import { ALERT_SEVERITY_LABEL } from '@/lib/utils/labels'

const SEVERITY_TONE = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
} as const

export default async function AlertsPage(props: PageProps<'/[org]/alerts'>) {
  const { org } = await props.params
  const context = await requireOrgContext(org)
  const alerts = await listAlerts(context.organizationId)
  const unreadCount = alerts.filter((a) => !a.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Оповещения</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `Непрочитано: ${unreadCount}` : 'Все прочитано'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton org={org} />}
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          title="Нет оповещений"
          description="Здесь будут появляться предупреждения о запасах, ошибки синхронизации и другие уведомления."
        />
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.isRead ? 'opacity-60' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <Badge tone={SEVERITY_TONE[alert.severity]}>{ALERT_SEVERITY_LABEL[alert.severity]}</Badge>
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
                {!alert.isRead && <MarkReadButton org={org} alertId={alert.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
