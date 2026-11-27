import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('glass rounded-card p-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2 className={cn('font-display text-heading font-semibold text-ink', className)} {...props} />
  )
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-body text-muted', className)} {...props} />
}
