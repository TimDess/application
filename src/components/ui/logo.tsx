import { brand } from '@/config/brand'
import { cn } from '@/lib/utils/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-end gap-0.5 font-ui text-[1.25rem] leading-none font-bold tracking-[-0.03em] text-ink',
        className,
      )}
    >
      {brand.wordmark}
      <span aria-hidden="true" className="mb-[0.18em] size-[0.3em] rounded-full bg-accent" />
    </span>
  )
}
