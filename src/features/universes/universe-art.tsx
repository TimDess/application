import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Cover illustration for a universe (identity lab, 28 November 2026): rounded shapes,
 * two tones from the universe color, and the brand's yellow dot hidden in each drawing.
 * Drawn in code (no images, no rights issues). Decorative: always aria-hidden.
 */
export function UniverseArt({
  iconKey,
  color,
  className,
}: {
  iconKey: string
  color: string
  className?: string
}) {
  const main: CSSProperties = { fill: color }
  const deep: CSSProperties = { fill: `color-mix(in srgb, ${color} 38%, #0b0a1a)` }
  const dot: CSSProperties = { fill: 'var(--accent)' }
  const line = (width: number): CSSProperties => ({
    fill: 'none',
    stroke: `color-mix(in srgb, ${color} 38%, #0b0a1a)`,
    strokeWidth: width,
    strokeLinecap: 'round',
  })
  const drawings: Record<string, ReactNode> = {
    gauge: (
      <>
        <path d="M14 58h14l10-14h30l14 8h20q6 0 6 6v4H14z" style={main} />
        <path d="M46 44h18l6 8H42z" style={deep} />
        <path d="M92 46h12l4-8h-10z" style={main} />
        <circle cx="34" cy="64" r="9" style={deep} />
        <circle cx="86" cy="64" r="9" style={deep} />
        <circle cx="34" cy="64" r="3.5" style={dot} />
        <path d="M8 78h104" style={{ ...line(3), strokeDasharray: '8 6' }} />
      </>
    ),
    gamepad: (
      <>
        <path
          d="M28 34h64q16 0 18 18l2 10q2 12-10 12-6 0-12-8l-6-6H36l-6 6q-6 8-12 8-12 0-10-12l2-10q2-18 18-18z"
          style={main}
        />
        <path d="M34 46v12M28 52h12" style={line(5)} />
        <circle cx="82" cy="48" r="5" style={dot} />
        <circle cx="92" cy="56" r="5" style={deep} />
      </>
    ),
    music: (
      <>
        <rect x="46" y="12" width="28" height="40" rx="14" style={main} />
        <path d="M52 24h16M52 32h16M52 40h16" style={line(3)} />
        <path d="M38 42q0 22 22 22t22-22" style={{ ...line(5), stroke: color }} />
        <path d="M60 64v10M46 76h28" style={{ ...line(5), stroke: color }} />
        <circle cx="92" cy="24" r="5" style={dot} />
      </>
    ),
    clapperboard: (
      <>
        <rect x="24" y="38" width="72" height="38" rx="8" style={main} />
        <path d="M24 30l68-14 4 14-68 14z" style={main} />
        <path d="M38 27l8 13M54 24l8 13M70 20l8 13" style={line(5)} />
        <circle cx="60" cy="57" r="5" style={dot} />
        <path d="M36 50h14M36 64h20" style={line(4)} />
      </>
    ),
    medal: (
      <>
        <circle cx="60" cy="45" r="28" style={main} />
        <path d="M60 31l12 9-5 14H53l-5-14z" style={deep} />
        <path d="M60 17v14M72 40l13-4M67 54l8 12M53 54l-8 12M48 40l-13-4" style={line(3.5)} />
        <circle cx="94" cy="72" r="5" style={dot} />
      </>
    ),
    landmark: (
      <>
        <path d="M24 34l36-18 36 18z" style={main} />
        <rect x="22" y="68" width="76" height="8" rx="3" style={main} />
        <path d="M34 40v24M50 40v24M70 40v24M86 40v24" style={{ ...line(7), stroke: color }} />
        <circle cx="60" cy="27" r="4" style={dot} />
      </>
    ),
    atom: (
      <>
        <ellipse cx="60" cy="45" rx="40" ry="14" style={{ ...line(4), stroke: color }} />
        <ellipse cx="60" cy="45" rx="40" ry="14" transform="rotate(60 60 45)" style={line(4)} />
        <ellipse
          cx="60"
          cy="45"
          rx="40"
          ry="14"
          transform="rotate(-60 60 45)"
          style={{ ...line(4), stroke: color }}
        />
        <circle cx="60" cy="45" r="8" style={dot} />
      </>
    ),
    globe: (
      <>
        <circle cx="60" cy="45" r="30" style={main} />
        <path d="M30 45h60M60 15q-16 30 0 60M60 15q16 30 0 60" style={line(3.5)} />
        <circle cx="96" cy="20" r="5" style={dot} />
      </>
    ),
  }
  const drawing = drawings[iconKey] ?? (
    <>
      <path d="M60 14l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" style={main} />
      <path d="M92 58l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" style={deep} />
      <circle cx="30" cy="66" r="5" style={dot} />
    </>
  )

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: `color-mix(in srgb, ${color} 22%, var(--bg-deep))` }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-20 -left-10 size-72 rounded-full opacity-50 blur-[70px]"
        style={{ background: color }}
      />
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMaxYMid meet"
        aria-hidden="true"
        className="absolute inset-0 size-full"
      >
        <circle cx="300" cy="100" r="92" style={{ fill: color, opacity: 0.14 }} />
        <g transform="translate(204 28) scale(1.6)">{drawing}</g>
      </svg>
    </div>
  )
}
