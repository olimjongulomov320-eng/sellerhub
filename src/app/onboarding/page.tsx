import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, listUserOrganizations } from '@/lib/auth/dal'
import { CreateStoreForm } from './create-store-form'

export const metadata: Metadata = { title: 'Создание магазина — SellerHub' }

export default async function OnboardingPage() {
  await verifySession()
  const memberships = await listUserOrganizations()

  if (memberships.length > 0) {
    redirect(`/${memberships[0].organization.slug}/dashboard`)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Шаг 1 из 5</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Создайте свой магазин
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Расскажите о своём бизнесе, чтобы мы могли всё настроить.
        </p>
      </div>
      <CreateStoreForm />
    </div>
  )
}
