# Roadmap et état du projet

Dernière mise à jour : 28 novembre 2026.

| Phase              | Contenu                                                                                         | État                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0 — Cadrage        | Brief, naming, directions artistiques, architecture, schéma                                     | ✅ Terminée (Kulto, direction 2, décisions validées) |
| 1 — Fondations     | Projet, design system, navigation, thèmes, Supabase, auth, profils, onboarding, CI              | ✅ Terminée                                          |
| 2 — Apprentissage  | Contenu « as code », lecteur de leçon, fiches, 5 formats, progression, parcours F1, mode invité | ✅ Terminée (mode invité reporté en 3C)              |
| 3 — Gamification   | XP, niveaux, série, défi du jour, révisions espacées, badges, ADN culturel, animations          | ✅ Terminée (lots 3A, 3B, 3C)                        |
| 4 — Compétition    | Cote, divisions, ligues, matchmaking, duels temps réel et asynchrones                           | À venir                                              |
| 5 — Social         | Amis, invitations, profils publics, duels privés, notifications                                 | À venir                                              |
| 6 — Administration | Éditeur de contenu, import, publication, événements, modération                                 | À venir                                              |
| 7 — Enrichissement | Nouveaux formats, nouveaux univers, PWA, événements temporaires                                 | À venir                                              |
| 8 — Production     | Audit sécurité et accessibilité, CSP, performances, domaine, projet prod                        | À venir                                              |

## Phase 1 — livré

- Next.js 16.4 + React 19 + TypeScript strict + Tailwind 4, Cache Components activés.
- Configuration centrale de la marque (`src/config/brand.ts`).
- Design system direction 2, thèmes clair / sombre / automatique sans flash, réduction des animations.
- Transition en vague au lancement d’une leçon et entre deux leçons (remplace l’écran de chargement).
- Navigation mobile (onglets) et desktop (sidebar).
- Supabase : 6 tables, RLS, 2 RPC, trigger d'initialisation, 9 univers, emails en français.
- Auth complète : inscription avec consentement, confirmation email, connexion, déconnexion, mot de passe oublié et réinitialisation, changement de mot de passe, export RGPD, suppression de compte.
- Onboarding en 5 étapes, accueil, explorer, jouer, ligue, profil, paramètres.
- Tests : 30 unitaires, 31 assertions pgTAP, 14 scénarios E2E (7 sur mobile, 7 sur desktop).
- CI GitHub Actions.

## Phase 2 — livré

- Schéma contenu (catégories, parcours, chapitres, leçons, notions, fiches, questions) et progression (sessions, tentatives, progression par leçon et par parcours).
- Solutions et explications dans le schéma privé ; scoring côté serveur ; une tentative par question ; déblocage séquentiel des leçons.
- Contenu « as code » : `content/*.json` validé par Zod, compilé en SQL idempotent.
- Parcours « Comprendre la F1 » : 3 chapitres, 9 leçons, 3 épreuves, 33 notions, 51 questions. **Publié** le 28 novembre 2026 après relecture par Tim.
- Lecteur de leçon : fiches, 5 mini-jeux (quiz, vrai/faux, associations, frise, devine l'année), correction expliquée, résultat, reprise.
- Pages univers et parcours, « Continue ton aventure » sur l'accueil.
- Tests : 36 unitaires, 64 assertions pgTAP, 18 scénarios E2E (mobile + desktop).

## Phase 3 — lot 3A livré

- XP attribuée par `complete_lesson` dans la même transaction : bonne réponse +10 (au prorata pour une réponse partielle), leçon terminée +50, sans faute +20, épreuve réussie (score ≥ 70) +100, chapitre terminé +150. Chaque récompense n'est obtenue qu'une fois (contrainte unique) : rejouer ne rapporte que ce qui n'avait pas encore été gagné.
- Niveaux global et par univers : XP cumulée pour le niveau L = 100 × (L − 1)^1,6.
- Objectif du jour = minutes choisies × 20 XP. Série : une leçon terminée valide la journée (jour local de l'utilisateur), 1 protection gagnée tous les 7 jours (2 max), consommée automatiquement.
- Valeurs réglables dans `game_config`, sans toucher au code.
- Interface : récompenses en fin de leçon (lignes d'XP, barre de niveau, série, objectif), écran « Niveau supérieur » plein écran, carte « Ta journée » sur l'accueil (série, 7 derniers jours, objectif, niveau), flamme dans l'en-tête mobile, statistiques et niveaux par univers sur le profil, export RGPD complété (progression et gamification).
- Les leçons terminées avant le lot 3A ne rapportent pas d'XP rétroactive.
- Tests : 40 unitaires, 96 assertions pgTAP, 18 scénarios E2E.

## Phase 3 — lot 3B livré

- Révisions espacées par notion (boîtes de Leitner 1 à 7, retours à 1, 3, 7, 16, 35, 90, 180 jours ; erreur → boîte 1). Les notions d'une leçon terminée entrent en boîte 1 (retour le lendemain) ; les leçons terminées avant le lot 3B ont été reprises (notions à revoir le jour même).
- Une révision pose la notion avec une autre question que la dernière vue quand c'est possible ; jusqu'à 10 questions ; +5 XP par bonne réponse, +30 XP à la fin.
- Défi du jour : 5 questions publiées, les mêmes pour tous, tirées une fois par jour (heure de Paris, réparties entre univers), une seule tentative, +50 XP, partage façon Wordle (cases, jamais les réponses).
- Une révision ou le défi du jour valide aussi la série.
- Pages `/defi` et `/revisions`, cartes « Au programme » sur l'accueil et sur Jouer, entrées dans la sidebar desktop.
- Parcours F1 publié après relecture.
- Indices reportés (décision du 28 novembre 2026).
- Tests : 41 unitaires, 124 assertions pgTAP, 22 scénarios E2E.

## Phase 3 — lot 3C livré

- 17 badges en 5 familles (progression, série, niveaux, révisions, défi du jour) et 4 raretés, attribués par Postgres à la fin d'une leçon ou d'une session (trigger sur `rewards`), renvoyés dans le résumé et révélés sur l'écran de résultat ; vitrine sur le profil (badges verrouillés avec leur condition). Rattrapage des badges déjà mérités.
- ADN culturel : maîtrise par univers (notions retenues, boîte de Leitner plafonnée à 5) en radar à 9 branches, titre selon l'univers dominant (`src/config/dna.ts`) et qualificatif Spécialiste / Touche-à-tout.
- Mode invité : connexions anonymes Supabase (limite intégrée de 30 par heure et par IP), page `/essai` avec le même consentement que l'inscription, bannière « Tu joues en invité », sauvegarde du compte (`/sauvegarder` : email + mot de passe, compte permanent après confirmation de l'email, même utilisateur donc progression conservée), suppression sans mot de passe pour les invités, purge quotidienne (pg_cron) des invités inactifs depuis 30 jours.
- Tests : 45 unitaires, 138 assertions pgTAP, 26 scénarios E2E.

## Écarts et points ouverts

- **Emails en production** : sans SMTP personnalisé (Brevo), Supabase n'envoie les emails qu'aux membres de l'équipe du projet et refuse la personnalisation des modèles. Indispensable avant d'ouvrir à d'autres joueurs (inscription, mot de passe oublié, sauvegarde d'un compte invité).
- **Mini-test de placement** de l'onboarding : phase 3.
- **Indices** pendant les leçons : reportés (non prioritaires, les révisions jouent le rôle de rattrapage).
- **Contenu** : un seul parcours publié (F1, 51 questions) ; il en faut davantage pour varier le défi du jour et les révisions.
- **Changement d'adresse email** : non inclus en phase 1 (le modèle d'email est prêt).
- **Pages légales** : brouillons à faire valider juridiquement avant toute ouverture publique.
- **Marque Kulto** : disponibilité (INPI, EUIPO, domaines) à vérifier.
