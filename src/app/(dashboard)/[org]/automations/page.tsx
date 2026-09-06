import { requireOrgContext } from '@/lib/services/organization'
import { listAutomations } from '@/lib/services/automations'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
} from '@/components/shared/data-table'
import { AutomationForm } from './automation-form'
import { ToggleAutomationButton } from './automation-row-actions'
import { RunNowButton } from './run-now-button'
import {
  AUTOMATION_TRIGGER_LABEL,
  AUTOMATION_ACTION_LABEL,
  AUTOMATION_STATUS_LABEL,
} from '@/lib/utils/labels'

export default async function AutomationsPage(
  props: PageProps<'/[org]/automations'>
) {
  const { org } = await props.params
  const context = await requireOrgContext(org)
  const automations = await listAutomations(context.organizationId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Автоматизации</h1>
          <p className="text-sm text-muted-foreground">
            Правила, которые отслеживают ваш магазин и создают оповещения автоматически.
          </p>
        </div>
        <RunNowButton org={org} />
      </div>

      <AutomationForm org={org} />

      {automations.length === 0 ? (
        <EmptyState
          title="Автоматизаций пока нет"
          description="Создайте правило выше, чтобы начать получать проактивные оповещения."
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>Название</Th>
            <Th>Триггер</Th>
            <Th>Действие</Th>
            <Th>Статус</Th>
            <Th>Последний запуск</Th>
            <Th className="text-right">Действия</Th>
          </DataTableHead>
          <DataTableBody>
            {automations.map((automation) => (
              <tr key={automation.id}>
                <Td className="font-medium">{automation.name}</Td>
                <Td className="text-muted-foreground">
                  {AUTOMATION_TRIGGER_LABEL[automation.trigger] ?? automation.trigger}
                </Td>
                <Td className="text-muted-foreground">
                  {AUTOMATION_ACTION_LABEL[automation.action] ?? automation.action}
                </Td>
                <Td>
                  <Badge tone={automation.status === 'ACTIVE' ? 'success' : 'default'}>
                    {AUTOMATION_STATUS_LABEL[automation.status]}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">
                  {automation.lastExecutedAt
                    ? new Date(automation.lastExecutedAt).toLocaleString('ru-RU')
                    : 'Никогда'}
                </Td>
                <Td className="text-right">
                  <ToggleAutomationButton
                    org={org}
                    automationId={automation.id}
                    status={automation.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'}
                  />
                </Td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
