import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function FormMessage({
  tone,
  children,
  className,
}: {
  tone: 'error' | 'success'
  children?: string
  className?: string
}) {
  if (!children) return null
  const Icon = tone === 'error' ? CircleAlert : CircleCheck
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2.5 text-body',
        tone === 'error'
          ? 'border-danger/40 bg-danger/10 text-ink'
          : 'border-success/40 bg-success/10 text-ink',
        className,
      )}
    >
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', tone === 'error' ? 'text-danger' : 'text-success')}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  )
}
