/**
 * The brand's yellow full stop at the end of a title ("Ligue.", "Salut Tim.").
 * Skipped when the title already ends with punctuation. Decorative for screen readers.
 */
export function TitleDot({ children }: { children: string }) {
  const text = children.trimEnd()
  if (/[.!?…:»]$/.test(text)) return <>{text}</>
  return (
    <>
      {text}
      <span aria-hidden="true" className="text-accent">
        .
      </span>
    </>
  )
}
