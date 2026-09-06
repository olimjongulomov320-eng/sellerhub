'use client'

import { useState, useTransition } from 'react'
import { askAssistantAction } from '@/lib/actions/ai-assistant'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Exchange = { question: string; answer: string }

export function AssistantChat({
  org,
  suggestions,
}: {
  org: string
  suggestions: readonly { id: string; label: string }[]
}) {
  const [history, setHistory] = useState<Exchange[]>([])
  const [isPending, startTransition] = useTransition()

  function ask(questionId: string) {
    startTransition(async () => {
      const result = await askAssistantAction(org, questionId)
      setHistory((prev) => [...prev, result])
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Button
            key={s.id}
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => ask(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Выберите вопрос выше, чтобы начать.
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((exchange, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{exchange.question}</p>
                <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
                  {exchange.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
