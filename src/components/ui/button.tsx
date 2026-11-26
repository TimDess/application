import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'border border-danger text-danger hover:bg-danger/10',
} as const

const sizes = {
  sm: 'h-9 px-3 text-body rounded-md',
  md: 'h-11 px-4 text-body rounded-md',
  lg: 'h-12 px-5 text-heading rounded-lg',
} as const

export type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,transform] duration-(--duration-fast) ease-(--ease-out)',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
