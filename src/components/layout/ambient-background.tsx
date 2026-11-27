import type { CSSProperties } from 'react'

/**
 * Soft light fields behind the interface (direction A). Pass a universe color to tint
 * the top glow (course and lesson pages). Hidden when the user prefers less transparency.
 */
export function AmbientBackground({ tint }: { tint?: string }) {
  return (
    <div className="ambient" aria-hidden="true">
      <span
        style={
          {
            width: 420,
            height: 420,
            left: -140,
            top: -120,
            background: tint ?? 'var(--ambient-2)',
            opacity: tint ? 0.3 : undefined,
          } as CSSProperties
        }
      />
      <span
        style={{ width: 360, height: 360, right: -160, top: '38%', background: 'var(--ambient-3)' }}
      />
      <span
        style={{
          width: 320,
          height: 320,
          left: '20%',
          bottom: -160,
          background: tint ? 'var(--ambient-2)' : 'var(--ambient-1)',
        }}
      />
    </div>
  )
}
