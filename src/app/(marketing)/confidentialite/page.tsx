import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/legal-page'
import { brand } from '@/config/brand'

export const metadata: Metadata = { title: 'Politique de confidentialité' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="26 novembre 2026">
      <h2>Ce que nous collectons</h2>
      <ul>
        <li>
          Ton adresse email et ton mot de passe (chiffré par notre fournisseur d’authentification,
          jamais lisible).
        </li>
        <li>
          Ton pseudo, ta couleur d’avatar et tes préférences (univers, objectif, thème,
          confidentialité).
        </li>
        <li>La date de ton consentement aux conditions et la confirmation de ton âge.</li>
      </ul>
      <h2>Ce que nous ne faisons pas</h2>
      <ul>
        <li>Pas de publicité, pas de revente de données, pas de traceurs publicitaires tiers.</li>
        <li>Ton adresse email n’est jamais affichée publiquement.</li>
      </ul>
      <h2>Où sont tes données</h2>
      <p>
        Les données sont hébergées par Supabase (base de données et authentification, région Union
        européenne) et l’application est servie par Vercel.
      </p>
      <h2>Tes droits</h2>
      <ul>
        <li>Exporter toutes tes données depuis Paramètres, Compte.</li>
        <li>Supprimer ton compte et toutes tes données immédiatement depuis le même écran.</li>
        <li>Choisir qui voit ton profil et si tu apparais dans les classements.</li>
      </ul>
      <h2>Conservation</h2>
      <p>
        Tes données sont conservées tant que ton compte existe. Elles sont supprimées dès que tu
        supprimes ton compte, sauf obligation légale contraire.
      </p>
      <p>
        Responsable du traitement et contact : à préciser avant l’ouverture publique de {brand.name}
        .
      </p>
    </LegalPage>
  )
}
