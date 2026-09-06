import { cn } from '@/lib/utils/cn'

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

const TONE_CLASSES: Record<BadgeTone, string> = {
  default: 'bg-surface-muted text-muted-foreground border-border',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-primary/10 text-primary border-primary/20',
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
