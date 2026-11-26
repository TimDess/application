import { getAvatarPreset } from '@/config/avatars'
import { cn } from '@/lib/utils/cn'

const sizes = {
  sm: 'size-8 text-caption',
  md: 'size-10 text-body',
  lg: 'size-16 text-title',
  xl: 'size-20 text-title',
}

export function Avatar({
  avatarKey,
  name,
  size = 'md',
  className,
}: {
  avatarKey: string | null | undefined
  name: string | null | undefined
  size?: keyof typeof sizes
  className?: string
}) {
  const preset = getAvatarPreset(avatarKey)
  const initial = (name?.trim()[0] ?? '?').toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-display font-semibold',
        sizes[size],
        className,
      )}
      style={{ background: preset.bg, color: preset.fg }}
    >
      {initial}
    </span>
  )
}
