import { Lightbulb } from 'lucide-react'
import type { PlayCard } from '@/features/learning/types'

/** Renders a learning card ("fiche") from its blocks. */
export function LearningCard({ card }: { card: PlayCard }) {
  return (
    <article className="step-in glass flex flex-col gap-4 rounded-card p-5">
      <h2 className="text-title">{card.title}</h2>
      {card.blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return (
              <p key={i} className="text-heading leading-relaxed font-normal text-ink">
                {block.text}
              </p>
            )
          case 'keyfigure':
            return (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="tabular font-display text-[2.5rem] leading-none font-semibold tracking-tight text-accent-text">
                  {block.value}
                </span>
                <span className="text-body text-muted">{block.label}</span>
              </div>
            )
          case 'list':
            return (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-body leading-relaxed text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )
          case 'swatches':
            return (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center gap-3 rounded-md border border-line px-3 py-2"
                  >
                    <span
                      aria-hidden="true"
                      className="size-8 shrink-0 rounded-full border border-line-strong"
                      style={{ background: s.color }}
                    />
                    <span className="flex flex-col">
                      <span className="text-body font-semibold text-ink">{s.label}</span>
                      <span className="text-caption text-muted">{s.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )
          case 'fact':
            return (
              <p
                key={i}
                className="flex gap-3 rounded-md bg-accent/10 px-4 py-3 text-body text-ink"
              >
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Le savais-tu ? </span>
                  {block.text}
                </span>
              </p>
            )
        }
      })}
    </article>
  )
}
