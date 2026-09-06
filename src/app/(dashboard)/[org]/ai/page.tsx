import { requireOrgContext } from '@/lib/services/organization'
import { ASSISTANT_QUESTIONS } from '@/lib/services/ai-assistant'
import { AssistantChat } from './assistant-chat'

export default async function AiAssistantPage(props: PageProps<'/[org]/ai'>) {
  const { org } = await props.params
  await requireOrgContext(org)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ИИ-ассистент</h1>
        <p className="text-sm text-muted-foreground">
          Задавайте вопросы о вашем магазине. Ответы основаны только на ваших реальных данных.
        </p>
      </div>
      <AssistantChat org={org} suggestions={ASSISTANT_QUESTIONS} />
    </div>
  )
}
