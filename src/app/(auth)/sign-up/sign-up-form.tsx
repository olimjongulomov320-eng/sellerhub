'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined)

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="name">Полное имя</Label>
        <Input id="name" name="name" placeholder="Иван Иванов" required />
        <FieldError messages={state?.errors?.name} />
      </div>

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
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" name="password" type="password" required />
        <FieldError messages={state?.errors?.password} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Не менее 8 символов, с буквой и цифрой.
        </p>
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Создание аккаунта…' : 'Создать аккаунт'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          Войти
        </Link>
      </p>
    </form>
  )
}
