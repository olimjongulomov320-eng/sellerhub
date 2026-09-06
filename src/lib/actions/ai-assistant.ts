'use server'

import { requireOrgContext } from '@/lib/services/organization'
import { answerQuestion } from '@/lib/services/ai-assistant'

export async function askAssistantAction(org: string, questionId: string) {
  const context = await requireOrgContext(org)
  return answerQuestion(context.organizationId, questionId)
}
