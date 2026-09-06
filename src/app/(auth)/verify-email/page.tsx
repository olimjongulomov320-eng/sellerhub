import type { Metadata } from 'next'
import Link from 'next/link'
import { verifyEmailToken } from '@/lib/actions/verify-email'

export const metadata: Metadata = { title: 'Подтверждение email — SellerHub' }

export default async function VerifyEmailPage(
  props: PageProps<'/verify-email'>
) {
  const searchParams = await props.searchParams
  const token = typeof searchParams.token === 'string' ? searchParams.token : ''

  if (!token) {
    return (
      <>
        <h1 className="mb-1 text-xl font-semibold">Проверьте почту</h1>
        <p className="text-sm text-muted-foreground">
          Мы отправили ссылку для подтверждения на ваш email.
        </p>
      </>
    )
  }

  const result = await verifyEmailToken(token)

  if (!result.success) {
    return (
      <>
        <h1 className="mb-1 text-xl font-semibold">Не удалось подтвердить</h1>
        <p className="mb-6 text-sm text-muted-foreground">{result.message}</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">
          Вернуться ко входу
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Email подтверждён</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ваш email успешно подтверждён.
      </p>
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        Продолжить
      </Link>
    </>
  )
}
