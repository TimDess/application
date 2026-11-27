# Roadmap et état du projet

Dernière mise à jour : 27 novembre 2026.

| Phase              | Contenu                                                                                         | État                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0 — Cadrage        | Brief, naming, directions artistiques, architecture, schéma                                     | ✅ Terminée (Kulto, direction 2, décisions validées) |
| 1 — Fondations     | Projet, design system, navigation, thèmes, Supabase, auth, profils, onboarding, CI              | ✅ Terminée                                          |
| 2 — Apprentissage  | Contenu « as code », lecteur de leçon, fiches, 5 formats, progression, parcours F1, mode invité | ⏭️ Prochaine                                         |
| 3 — Gamification   | XP, niveaux, série, défi du jour, révisions espacées, badges, ADN culturel, animations          | À venir                                              |
| 4 — Compétition    | Cote, divisions, ligues, matchmaking, duels temps réel et asynchrones                           | À venir                                              |
| 5 — Social         | Amis, invitations, profils publics, duels privés, notifications                                 | À venir                                              |
| 6 — Administration | Éditeur de contenu, import, publication, événements, modération                                 | À venir                                              |
| 7 — Enrichissement | Nouveaux formats, nouveaux univers, PWA, événements temporaires                                 | À venir                                              |
| 8 — Production     | Audit sécurité et accessibilité, CSP, performances, domaine, projet prod                        | À venir                                              |

## Phase 1 — livré

- Next.js 16.4 + React 19 + TypeScript strict + Tailwind 4, Cache Components activés.
- Configuration centrale de la marque (`src/config/brand.ts`).
- Design system direction 2, thèmes clair / sombre / automatique sans flash, réduction des animations.
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
- Parcours « Comprendre la F1 » : 3 chapitres, 9 leçons, 3 épreuves, 33 notions, 51 questions. **Statut : en relecture** (visible des relecteurs uniquement).
- Lecteur de leçon : fiches, 5 mini-jeux (quiz, vrai/faux, associations, frise, devine l'année), correction expliquée, résultat, reprise.
- Pages univers et parcours, « Continue ton aventure » sur l'accueil.
- Tests : 36 unitaires, 64 assertions pgTAP, 18 scénarios E2E (mobile + desktop).

## Écarts et points ouverts

- **Mode invité** : reporté en phase 3 (conversion d'un compte anonyme en compte email à concevoir proprement).
- **Mini-test de placement** de l'onboarding : phase 3.
- **Indices** pendant les leçons : phase 3, avec l'XP (réduction de score).
- **Contenu F1** : à relire par Tim avant publication.
- **Changement d'adresse email** : non inclus en phase 1 (le modèle d'email est prêt).
- **Pages légales** : brouillons à faire valider juridiquement avant toute ouverture publique.
- **Marque Kulto** : disponibilité (INPI, EUIPO, domaines) à vérifier.
