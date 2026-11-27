import { cn } from '@/lib/utils/cn'

/**
 * Generative cover art for a universe, drawn from its icon key and color (no images,
 * no rights issues). Decorative: always aria-hidden. Works in both themes.
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
  const common = {
    width: '100%',
    height: '100%',
    viewBox: '0 0 400 200',
    preserveAspectRatio: 'xMidYMid slice' as const,
    'aria-hidden': true,
  }
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
      <svg {...common} className="absolute inset-0">
        {iconKey === 'gauge' ? (
          <>
            <path
              d="M20 170 C 60 60, 150 50, 190 100 S 290 170, 330 100 S 390 30, 410 70"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M20 170 C 60 60, 150 50, 190 100 S 290 170, 330 100 S 390 30, 410 70"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeDasharray="2 11"
              strokeLinecap="round"
            />
            <circle cx="190" cy="100" r="8" fill="var(--accent)" />
          </>
        ) : iconKey === 'music' ? (
          <g fill="none" stroke={color} strokeOpacity="0.8">
            {[30, 50, 70, 90, 110, 130].map((r) => (
              <circle key={r} cx="300" cy="120" r={r} strokeWidth="2" />
            ))}
            <circle cx="300" cy="120" r="14" fill={color} />
          </g>
        ) : iconKey === 'gamepad' ? (
          <g fill={color} fillOpacity="0.75">
            {[
              [220, 120],
              [244, 96],
              [268, 120],
              [292, 72],
              [316, 120],
              [340, 96],
              [268, 144],
              [316, 144],
              [364, 72],
            ].map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="22" height="22" rx="3" />
            ))}
          </g>
        ) : iconKey === 'clapperboard' ? (
          <g fill={color} fillOpacity="0.7">
            {Array.from({ length: 9 }, (_, i) => (
              <rect
                key={i}
                x={30 + i * 44}
                y="40"
                width="30"
                height="120"
                rx="4"
                opacity={i % 2 ? 0.55 : 1}
              />
            ))}
          </g>
        ) : (
          <g fill="none" stroke={color} strokeOpacity="0.7" strokeWidth="2">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M-20 ${150 - i * 18} C 100 ${60 - i * 10}, 260 ${200 - i * 20}, 420 ${80 - i * 8}`}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}
