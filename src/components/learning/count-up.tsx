'use client'

import { useEffect, useState } from 'react'
import { motionReduced } from '@/components/theme/theme-client'

/** Counts from 0 to `value` (ease-out). Shows the final value at once when motion is reduced. */
export function CountUp({
  value,
  duration = 900,
  delay = 0,
  suffix = '',
}: {
  value: number
  duration?: number
  delay?: number
  suffix?: string
}) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    let frame = 0
    if (motionReduced()) {
      frame = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(frame)
    }
    let start: number | null = null
    const tick = (now: number) => {
      start ??= now + delay
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      setShown(Math.round(value * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, delay])
  return (
    <span className="tabular" aria-hidden="true">
      {shown}
      {suffix}
    </span>
  )
}
