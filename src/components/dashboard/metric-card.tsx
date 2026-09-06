import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

export function MetricCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'warning' | 'danger'
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1.5 text-2xl font-semibold tracking-tight',
            tone === 'warning' && 'text-warning',
            tone === 'danger' && 'text-danger'
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}
