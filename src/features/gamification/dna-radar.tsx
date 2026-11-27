import type { DnaBranch } from '@/config/dna'

const SIZE = 300
const CENTER = SIZE / 2
const RADIUS = 104

function point(index: number, count: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  return [
    CENTER + Math.cos(angle) * RADIUS * ratio,
    CENTER + Math.sin(angle) * RADIUS * ratio,
  ] as const
}

/** Radar of mastery per universe. The figure is decorative; the list below carries the data. */
export function DnaRadar({
  branches,
  labels,
}: {
  branches: DnaBranch[]
  labels: Record<string, string>
}) {
  const n = branches.length
  if (n < 3) return null
  const shape = branches
    .map((b, i) => point(i, n, Math.max(0.03, b.score / 100)).join(','))
    .join(' ')
  return (
    <svg
      viewBox={`-36 -6 ${SIZE + 72} ${SIZE + 12}`}
      className="mx-auto w-full max-w-[22rem]"
      role="img"
      aria-label="Radar de ta maîtrise par univers (détail dans la liste ci-dessous)"
    >
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={branches.map((_, i) => point(i, n, r).join(',')).join(' ')}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}
      {branches.map((b, i) => {
        const [x, y] = point(i, n, 1)
        return (
          <line
            key={b.slug}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth="1"
          />
        )
      })}
      <polygon
        points={shape}
        fill="color-mix(in srgb, var(--accent) 30%, transparent)"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {branches.map((b, i) => {
        const [x, y] = point(i, n, 1.24)
        return (
          <text
            key={b.slug}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="var(--muted)"
          >
            {labels[b.slug] ?? b.slug}
          </text>
        )
      })}
    </svg>
  )
}
