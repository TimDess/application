import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export const inputClasses = cn(
  'h-11 w-full rounded-md border border-line bg-surface px-3 text-body text-ink',
  'transition-colors duration-(--duration-fast) placeholder:text-muted/70',
  'hover:border-line-strong focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30 focus-visible:outline-none',
  'disabled:opacity-60 aria-invalid:border-danger',
)

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-body font-medium text-ink', className)} {...props} />
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="text-caption font-medium text-danger">
      {children}
    </p>
  )
}

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="text-caption text-muted">
      {children}
    </p>
  )
}

export type TextFieldProps = Omit<ComponentProps<'input'>, 'name'> & {
  name: string
  label: string
  error?: string
  hint?: ReactNode
  /** Rendered inside the input box, on the right (e.g. a show-password button). */
  trailing?: ReactNode
}

export function TextField({
  name,
  label,
  error,
  hint,
  trailing,
  id,
  className,
  ...props
}: TextFieldProps) {
  const inputId = id ?? name
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(inputClasses, trailing ? 'pr-12' : null)}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        ) : null}
      </div>
      <FieldHint id={`${inputId}-hint`}>{hint}</FieldHint>
      <FieldError id={`${inputId}-error`}>{error}</FieldError>
    </div>
  )
}

export function CheckboxField({
  name,
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'name' | 'type'> & {
  name: string
  label: ReactNode
  error?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="flex cursor-pointer items-start gap-3 text-body text-ink">
        <input
          type="checkbox"
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line accent-(--accent)"
          {...props}
        />
        <span>{label}</span>
      </label>
      <FieldError id={`${name}-error`}>{error}</FieldError>
    </div>
  )
}
