'use client'

import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { brand } from '@/config/brand'

const dayLabel = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** Wordle-style result: squares only, never the answers. */
export function shareText(day: string, results: boolean[], origin: string) {
  const correct = results.filter(Boolean).length
  const squares = results.map((r) => (r ? '🟨' : '⬛')).join('')
  const date = dayLabel.format(new Date(`${day}T00:00:00Z`))
  return `${brand.name} · Défi du ${date} · ${correct}/${results.length}\n${squares}\n${origin.replace(/^https?:\/\//, '')}`
}

export function ShareButton({ day, results }: { day: string; results: boolean[] }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function share() {
    const text = shareText(day, results, window.location.origin)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      // The user closing the share sheet is not an error.
      if (e instanceof DOMException && e.name === 'AbortError') return
      setFailed(true)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      <Button size="lg" variant="secondary" onClick={share}>
        {copied ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Share2 className="size-4" aria-hidden="true" />
        )}
        {copied ? 'Copié !' : 'Partager mon résultat'}
      </Button>
      <p role="status" className="text-center text-caption text-muted">
        {failed ? 'Le partage n’est pas disponible sur cet appareil.' : ''}
      </p>
    </div>
  )
}
