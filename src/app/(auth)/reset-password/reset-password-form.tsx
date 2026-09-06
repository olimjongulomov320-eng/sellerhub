'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div>
        <Label htmlFor="password">Новый пароль</Label>
        <Input id="password" name="password" type="password" required />
        <FieldError messages={state?.errors?.password} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
        />
        <FieldError messages={state?.errors?.confirmPassword} />
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Сброс…' : 'Сбросить пароль'}
      </Button>
    </form>
  )
}
