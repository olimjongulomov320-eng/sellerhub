'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Megaphone,
  Plug,
  BarChart3,
  Bot,
  Zap,
  Bell,
  ScrollText,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Дашборд', href: '', icon: LayoutDashboard },
  { label: 'Товары', href: '/products', icon: Package },
  { label: 'Склад', href: '/inventory', icon: Boxes },
  { label: 'Заказы', href: '/orders', icon: ShoppingCart },
  { label: 'Клиенты', href: '/customers', icon: Users },
  { label: 'Объявления', href: '/listings', icon: Megaphone },
  { label: 'Интеграции', href: '/integrations', icon: Plug },
  { label: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { label: 'ИИ-ассистент', href: '/ai', icon: Bot },
  { label: 'Автоматизации', href: '/automations', icon: Zap },
  { label: 'Оповещения', href: '/alerts', icon: Bell },
  { label: 'Активность', href: '/activity', icon: ScrollText },
  { label: 'Настройки', href: '/settings', icon: Settings },
]

export function SidebarNav({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const orgBase = `/${orgSlug}`
  const dashboardHref = `${orgBase}/dashboard`

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map((item) => {
        const href = item.href === '' ? dashboardHref : `${orgBase}${item.href}`
        const isActive =
          item.href === ''
            ? pathname === dashboardHref
            : pathname.startsWith(href)
        const Icon = item.icon

        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
