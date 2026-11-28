import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary: 'glow-accent bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'glass text-ink hover:border-line-strong',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'border border-danger text-danger hover:bg-danger/10',
} as const

const sizes = {
  sm: 'h-9 px-3.5 text-body rounded-[12px]',
  md: 'h-11 px-4 text-body rounded-control',
  lg: 'h-13 px-5 text-heading rounded-control',
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
    // Press feedback on touch-down: squeeze fast, spring back with a slight overshoot.
    'transition-[background-color,border-color,color,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'active:scale-[0.96] active:duration-75 active:ease-out disabled:pointer-events-none disabled:opacity-50',
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
