import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Новый пароль — SellerHub' }

export default async function ResetPasswordPage(
  props: PageProps<'/reset-password'>
) {
  const searchParams = await props.searchParams
  const token = typeof searchParams.token === 'string' ? searchParams.token : ''

  if (!token) {
    return (
      <>
        <h1 className="mb-1 text-xl font-semibold">Недействительная ссылка</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          В этой ссылке для сброса пароля отсутствует токен.
        </p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Запросить новую ссылку
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Установите новый пароль</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Выберите новый пароль для своего аккаунта.
      </p>
      <ResetPasswordForm token={token} />
    </>
  )
}
