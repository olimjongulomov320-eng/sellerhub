import { requireOrgContext } from '@/lib/services/organization'
import { prisma } from '@/lib/db/client'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Card, CardContent } from '@/components/ui/card'

const ACTION_LABELS: Record<string, string> = {
  'organization.created': 'создал(а) этот магазин',
  'product.created': 'создал(а) товар',
  'product.updated': 'обновил(а) товар',
  'product.archived': 'архивировал(а) товар',
  'product.duplicated': 'дублировал(а) товар',
  'product.deleted': 'удалил(а) товар',
  'order.created': 'создал(а) заказ',
  'order.status_changed': 'изменил(а) статус заказа',
  'integration.connect_attempted': 'попытался(ась) подключить маркетплейс',
  'integration.disconnected': 'отключил(а) маркетплейс',
}

export default async function ActivityPage(props: PageProps<'/[org]/activity'>) {
  const { org } = await props.params
  const context = await requireOrgContext(org)

  const logs = await prisma.activityLog.findMany({
    where: { organizationId: context.organizationId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Активность</h1>
        <p className="text-sm text-muted-foreground">
          Журнал изменений, внесённых в вашем магазине.
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="Активности пока нет" description="Действия в вашем магазине будут отображаться здесь." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start justify-between p-4 text-sm">
                  <div>
                    <p>
                      <span className="font-medium">
                        {log.user?.name ?? log.user?.email ?? 'Система'}
                      </span>{' '}
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.entityType}</p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
