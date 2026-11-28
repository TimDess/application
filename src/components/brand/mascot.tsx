import { cn } from '@/lib/utils/cn'

/**
 * « Le Point », the brand mascot: the yellow dot of the logo as a character
 * (style « Pastille », chosen in the identity lab on 28 November 2026).
 * Pure SVG + CSS animations (neutralised by reduced motion). Decorative by default;
 * pass `label` when the expression carries meaning not said in nearby text.
 */
export type MascotMood = 'neutral' | 'happy' | 'oops' | 'streak' | 'sleep' | 'duel' | 'party'

const Y = '#FFC83D'
const YD = '#E8A800'
const INK = '#1B1838'
const FLAME = '#FF6A2B'
const RED = '#FF4D4D'

const motion: Record<MascotMood, string> = {
  neutral: 'mascot-bob',
  happy: 'mascot-jump',
  oops: 'mascot-squash',
  streak: 'mascot-bob',
  sleep: 'mascot-breathe',
  duel: 'mascot-bob',
  party: 'mascot-wiggle',
}

export function Mascot({
  mood = 'neutral',
  size = 96,
  label,
  animated = true,
  className,
}: {
  mood?: MascotMood
  size?: number
  label?: string
  animated?: boolean
  className?: string
}) {
  const a11y = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true } as const)
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn('mascot shrink-0 overflow-visible', className)}
      {...a11y}
    >
      <g className={animated ? motion[mood] : undefined}>
        <Arms mood={mood} />
        <circle cx="60" cy="64" r="34" fill={Y} />
        <circle cx="74" cy="74" r="6" fill="#FFB0A0" opacity=".55" />
        <circle cx="46" cy="74" r="6" fill="#FFB0A0" opacity=".55" />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        <Extras mood={mood} />
      </g>
    </svg>
  )
}

function Eyes({ mood }: { mood: MascotMood }) {
  const stroke = { fill: 'none', stroke: INK, strokeLinecap: 'round' as const }
  if (mood === 'happy' || mood === 'party')
    return <path d="M44 58q6-8 12 0M64 58q6-8 12 0" strokeWidth="4" {...stroke} />
  if (mood === 'sleep')
    return <path d="M44 60q6 4 12 0M64 60q6 4 12 0" strokeWidth="3.5" {...stroke} />
  const y = mood === 'oops' ? 62 : 58
  return (
    <>
      <g className={mood === 'neutral' ? 'mascot-blink' : undefined}>
        <ellipse cx="50" cy={y} rx="5" ry="7" fill={INK} />
        <ellipse cx="70" cy={y} rx="5" ry="7" fill={INK} />
        <circle cx="51.5" cy={y - 2.5} r="1.6" fill="#fff" />
        <circle cx="71.5" cy={y - 2.5} r="1.6" fill="#fff" />
      </g>
      {mood === 'oops' ? <path d="M43 50l11-4M77 50l-11-4" strokeWidth="3.5" {...stroke} /> : null}
      {mood === 'duel' ? <path d="M42 49l13 5M78 49l-13 5" strokeWidth="4" {...stroke} /> : null}
    </>
  )
}

function Mouth({ mood }: { mood: MascotMood }) {
  const line = { fill: 'none', stroke: INK, strokeLinecap: 'round' as const }
  switch (mood) {
    case 'happy':
    case 'party':
      return (
        <>
          <path d="M50 70q10 12 20 0z" fill={INK} />
          <path d="M54 74q6 4 12 0" fill="#FF7A7A" />
        </>
      )
    case 'oops':
      return <path d="M51 76q4-4 9 0t9 0" strokeWidth="3" {...line} />
    case 'sleep':
      return <ellipse cx="60" cy="74" rx="3" ry="2.5" fill={INK} />
    case 'duel':
      return <path d="M52 73q8 5 16-1" strokeWidth="3.5" {...line} />
    case 'streak':
      return <path d="M50 70q10 10 20 0" strokeWidth="3.5" {...line} />
    default:
      return <path d="M53 71q7 6 14 0" strokeWidth="3.5" {...line} />
  }
}

function Arms({ mood }: { mood: MascotMood }) {
  const s = { fill: 'none', stroke: YD, strokeWidth: 7, strokeLinecap: 'round' as const }
  if (mood === 'happy' || mood === 'party')
    return <path d="M30 64q-10-10-8-22M90 64q10-10 8-22" {...s} />
  if (mood === 'duel')
    return (
      <>
        <path d="M30 70q-10 2-12-8" {...s} />
        <circle cx="17" cy="60" r="6" fill={Y} stroke={YD} strokeWidth="2" />
        <path d="M90 70q8 6 14 4" {...s} />
      </>
    )
  if (mood === 'streak') return <path d="M30 68q-8 4-10 10M90 68q8 4 10 10" {...s} />
  return null
}

function Extras({ mood }: { mood: MascotMood }) {
  if (mood === 'oops') return <path d="M86 42q5 8 0 11q-5-3 0-11z" fill="#7CC6FF" />
  if (mood === 'sleep')
    return (
      <g className="mascot-zz fill-ink font-ui font-extrabold">
        <text x="86" y="40" fontSize="13">
          z
        </text>
        <text x="94" y="28" fontSize="17">
          Z
        </text>
      </g>
    )
  if (mood === 'streak')
    return (
      <g className="mascot-flick">
        <path
          d="M60 10c6 8 12 12 12 20a12 12 0 0 1-24 0c0-6 4-9 6-13 1 5 3 7 6 7 0-5-2-9 0-14z"
          fill={FLAME}
        />
        <path d="M60 22c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 3-5 6-10z" fill={Y} />
      </g>
    )
  if (mood === 'duel')
    return (
      <>
        <path d="M27 47q33-10 66 0l-2 8q-31-9-62 0z" fill={RED} />
        <path d="M92 50l14 6-12 3" fill={RED} />
      </>
    )
  if (mood === 'party')
    return (
      <g>
        <path d="M60 4l-12 30h24z" fill="#5B93FF" />
        <circle cx="60" cy="4" r="4" fill={RED} />
        <rect x="14" y="30" width="5" height="5" rx="1" fill={RED} />
        <rect x="100" y="38" width="5" height="5" rx="1" fill="#4ADE80" />
        <circle cx="22" cy="86" r="3" fill="#5B93FF" />
        <circle cx="102" cy="84" r="3" fill={RED} />
      </g>
    )
  return null
}
