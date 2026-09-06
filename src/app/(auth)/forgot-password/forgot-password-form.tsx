'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined
  )

  if (state?.message && !state.errors) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground">{state.message}</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">
          Вернуться ко входу
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <FieldError messages={state?.errors?.email} />
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Отправка…' : 'Отправить ссылку'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-primary hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  )
}
