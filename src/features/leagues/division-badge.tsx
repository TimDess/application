import { Shield } from 'lucide-react'
import { divisionOf } from '@/config/divisions'
import { cn } from '@/lib/utils/cn'

/** Division shield with its name: the colour is never the only cue. */
export function DivisionBadge({ value, size = 'md' }: { value: string; size?: 'md' | 'lg' }) {
  const d = divisionOf(value)
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn('grid place-items-center rounded-full', size === 'lg' ? 'size-14' : 'size-9')}
        style={{ background: `color-mix(in srgb, ${d.color} 22%, transparent)`, color: d.color }}
      >
        <Shield
          className={size === 'lg' ? 'size-7' : 'size-5'}
          fill="currentColor"
          fillOpacity={0.35}
        />
      </span>
      <span
        className={cn(
          'font-display font-bold text-ink',
          size === 'lg' ? 'text-title' : 'text-heading',
        )}
      >
        {d.label}
      </span>
    </span>
  )
}
