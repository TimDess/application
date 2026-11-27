import { brand } from '@/config/brand'
import { cn } from '@/lib/utils/cn'

/** Animated wordmark: letters wave, the "Soleil" dot bounces. Static when motion is reduced. */
export function BrandLoader({
  label = 'Chargement',
  className,
  size = 'md',
}: {
  label?: string
  className?: string
  size?: 'md' | 'lg'
}) {
  const letters = brand.wordmark.split('')
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-3', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex items-end font-display leading-none font-bold tracking-[-0.03em] text-ink',
          size === 'lg' ? 'text-[2.75rem]' : 'text-[1.75rem]',
        )}
      >
        {letters.map((l, i) => (
          <span
            key={i}
            className="inline-block [animation:kulto-letter-wave_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {l}
          </span>
        ))}
        <span className="mb-[0.16em] ml-[0.04em] inline-block size-[0.3em] [animation:kulto-dot-bounce_1.1s_var(--ease-in-out)_infinite] rounded-full bg-accent" />
      </span>
      <span className="text-caption text-muted">{label}</span>
    </div>
  )
}

/** Full-height centered loader for route-level fallbacks. */
export function BrandLoaderScreen({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <BrandLoader label={label} size="lg" />
    </div>
  )
}
