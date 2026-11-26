import { cn } from '@/lib/utils/cn'

export function Progress({
  value,
  max = 100,
  label,
  className,
  barClassName,
}: {
  value: number
  max?: number
  label: string
  className?: string
  barClassName?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-accent transition-[width] duration-(--duration-slow) ease-(--ease-out)',
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
