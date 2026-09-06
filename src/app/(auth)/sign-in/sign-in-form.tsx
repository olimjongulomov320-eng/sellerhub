'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, undefined)

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

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Пароль</Label>
          <Link
            href="/forgot-password"
            className="mb-1.5 text-xs text-primary hover:underline"
          >
            Забыли пароль?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required />
        <FieldError messages={state?.errors?.password} />
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Вход…' : 'Войти'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/sign-up" className="text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  )
}
