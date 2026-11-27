import { brand } from '@/config/brand'

/** Short "lights out" moment between the intro and the first card. */
export function LaunchScreen({ title }: { title: string }) {
  return (
    <div role="status" className="fixed inset-0 z-50 grid place-items-center bg-bg">
      <div className="relative grid place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute size-40 [animation:launch-flash_900ms_var(--ease-out)_both] rounded-full border-2 border-accent"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
        <div className="flex [animation:trophy-in_520ms_var(--ease-out)_both] flex-col items-center gap-2">
          <span
            className="inline-flex items-end font-display text-[2.5rem] leading-none font-bold tracking-[-0.03em] text-ink"
            aria-hidden="true"
          >
            {brand.wordmark}
            <span className="mb-[0.16em] ml-[0.04em] inline-block size-[0.3em] [animation:kulto-dot-bounce_900ms_var(--ease-in-out)_infinite] rounded-full bg-accent" />
          </span>
          <span className="text-heading font-semibold text-ink">C’est parti !</span>
          <span className="max-w-xs text-caption text-muted">{title}</span>
        </div>
      </div>
    </div>
  )
}
