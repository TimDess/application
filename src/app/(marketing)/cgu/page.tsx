import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/legal-page'
import { brand } from '@/config/brand'

export const metadata: Metadata = { title: 'Conditions d’utilisation' }

export default function TermsPage() {
  return (
    <LegalPage title="Conditions d’utilisation" updated="26 novembre 2026">
      <h2>1. Le service</h2>
      <p>
        {brand.name} est une application d’apprentissage de la culture générale et populaire par le
        jeu. L’accès au service est gratuit pendant la phase de développement.
      </p>
      <h2>2. Âge minimum</h2>
      <p>
        Le service est réservé aux personnes âgées de {brand.legal.minimumAge} ans ou plus, âge du
        consentement numérique en France.
      </p>
      <h2>3. Ton compte</h2>
      <ul>
        <li>Tu es responsable de la confidentialité de ton mot de passe.</li>
        <li>
          Ton pseudo ne doit pas usurper l’identité d’une autre personne ni contenir de propos
          injurieux.
        </li>
        <li>Tu peux supprimer ton compte à tout moment depuis les paramètres.</li>
      </ul>
      <h2>4. Comportement</h2>
      <p>
        La triche, l’automatisation des parties et toute tentative de contourner les règles du jeu
        ou la sécurité du service peuvent entraîner la suspension du compte.
      </p>
      <h2>5. Contenus</h2>
      <p>
        Les contenus pédagogiques sont vérifiés avant publication. Si tu repères une erreur, tu
        pourras la signaler depuis l’application.
      </p>
      <h2>6. Contact</h2>
      <p>L’adresse de contact sera publiée avant l’ouverture publique.</p>
    </LegalPage>
  )
}
