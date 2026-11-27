'use client'

import { useEffect, useState } from 'react'
import { motionReduced } from '@/components/theme/theme-client'
import { cn } from '@/lib/utils/cn'

/**
 * A level progress bar that animates from `from` to `to` (ratios 0..1). When the
 * level changed it fills up, wraps to empty and continues into the new level.
 */
export function LevelBar({
  from,
  to,
  levelUp = false,
  delay = 300,
  label,
  className,
}: {
  from: number
  to: number
  levelUp?: boolean
  delay?: number
  label: string
  className?: string
}) {
  const [width, setWidth] = useState(from)
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms))
    if (motionReduced()) {
      later(() => setWidth(to), 0)
    } else if (levelUp) {
      later(() => setWidth(1), delay)
      later(() => {
        setAnimate(false)
        setWidth(0)
      }, delay + 750)
      later(() => {
        setAnimate(true)
        setWidth(to)
      }, delay + 800)
    } else {
      later(() => setWidth(to), delay)
    }
    return () => timers.forEach(clearTimeout)
  }, [from, to, levelUp, delay])

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(to * 100)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-accent',
          animate && 'transition-[width] duration-700 ease-(--ease-out)',
        )}
        style={{ width: `${Math.round(width * 1000) / 10}%` }}
      />
    </div>
  )
}
