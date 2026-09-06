import type { Metadata } from 'next'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Вход — SellerHub' }

export default function SignInPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">С возвращением</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Войдите в свой аккаунт SellerHub.
      </p>
      <SignInForm />
    </>
  )
}
