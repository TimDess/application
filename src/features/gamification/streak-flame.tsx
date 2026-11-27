import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/** The streak flame: lit (Soleil, flickering) when the streak is alive, grey otherwise. */
export function StreakFlame({
  lit,
  ignite = false,
  className,
}: {
  lit: boolean
  /** Plays the ignition animation once (the streak just grew). */
  ignite?: boolean
  className?: string
}) {
  return (
    <Flame
      aria-hidden="true"
      className={cn(
        'shrink-0',
        lit ? 'fill-accent/35 text-accent' : 'text-muted',
        lit && (ignite ? 'flame-ignite' : 'flame-lit'),
        className,
      )}
    />
  )
}
