import type { Metadata } from 'next'
import { SignUpForm } from './sign-up-form'

export const metadata: Metadata = { title: 'Регистрация — SellerHub' }

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Создайте аккаунт</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Начните управлять своим маркетплейс-бизнесом.
      </p>
      <SignUpForm />
    </>
  )
}
