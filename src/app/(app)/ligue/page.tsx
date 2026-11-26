import type { Metadata } from 'next'
import { PageHeader, SectionTitle } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { SoonBadge } from '@/components/ui/pill'

export const metadata: Metadata = { title: 'Ligue' }

const divisions = ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Master', 'Légende']

export default function LeaguePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ligue"
        description="Le mode compétitif arrive en phase 4."
        action={<SoonBadge phase={4} />}
      />
      <Card className="flex flex-col gap-4">
        <SectionTitle>Comment ça marchera</SectionTitle>
        <ul className="flex flex-col gap-2 text-body text-muted">
          <li>Chaque semaine, tu rejoins une ligue d’une trentaine de joueurs de ta division.</li>
          <li>Tes duels classés et le défi du jour te rapportent des points de championnat.</li>
          <li>
            Seuls tes meilleurs duels comptent : la régularité et la précision battent le temps
            passé.
          </li>
          <li>En fin de semaine, les premiers montent de division et les derniers redescendent.</li>
        </ul>
      </Card>
      <section aria-labelledby="divisions" className="flex flex-col gap-3">
        <SectionTitle>
          <span id="divisions">Les divisions</span>
        </SectionTitle>
        <ol className="flex flex-wrap gap-2">
          {divisions.map((d, i) => (
            <li
              key={d}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-body"
            >
              <span className="tabular text-caption text-muted">{i + 1}</span>
              <span className="font-medium text-ink">{d}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
