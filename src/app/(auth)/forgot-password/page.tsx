import type { Metadata } from 'next'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = { title: 'Восстановление пароля — SellerHub' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Сброс пароля</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Мы отправим вам ссылку для сброса пароля по email.
      </p>
      <ForgotPasswordForm />
    </>
  )
}
