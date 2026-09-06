import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Package,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react'

const FEATURES = [
  { label: 'Товары', icon: Package },
  { label: 'Склад', icon: Boxes },
  { label: 'Заказы', icon: ShoppingCart },
  { label: 'Клиенты', icon: Users },
  { label: 'Аналитика', icon: BarChart3 },
  { label: 'Автоматизация', icon: Zap },
]

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border px-6 md:px-10">
        <span className="text-lg font-semibold tracking-tight">
          SellerHub
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Войти
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Начать бесплатно</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-center md:pt-32">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
            Управляйте всем маркетплейс-бизнесом
            <br />
            из одного места.
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground md:text-base">
            {FEATURES.map((f, i) => (
              <span key={f.label} className="flex items-center gap-1.5">
                <f.icon className="size-4 text-primary" />
                {f.label}
                {i < FEATURES.length - 1 && (
                  <span className="ml-1 text-border-strong">·</span>
                )}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Начать бесплатно
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Как это работает
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-6">
              {[
                'Выручка',
                'Прибыль',
                'Заказы',
                'Продано единиц',
                'Стоимость запасов',
                'Активные объявления',
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-surface-muted p-4"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-2 h-6 w-16 rounded bg-border" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
              <div className="h-40 rounded-lg border border-border bg-surface-muted" />
              <div className="h-40 rounded-lg border border-border bg-surface-muted" />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-primary">01</p>
              <h3 className="mt-1 text-lg font-semibold">Подключите свои каналы</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Начните с OLX. Переносите товары, объявления и заказы, не меняя
                привычный способ продаж.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary">02</p>
              <h3 className="mt-1 text-lg font-semibold">Управляйте из одной панели</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Товары, склад, заказы и клиенты в едином быстром интерфейсе,
                созданном для продавцов.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary">03</p>
              <h3 className="mt-1 text-lg font-semibold">Растите с автоматизацией и ИИ</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Получайте оповещения до того, как закончатся запасы, и позвольте
                ИИ находить то, что требует вашего внимания.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SellerHub. Все права защищены.
      </footer>
    </div>
  )
}
