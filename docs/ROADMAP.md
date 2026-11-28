# Roadmap et état du projet

Dernière mise à jour : 28 novembre 2026.

| Phase              | Contenu                                                                                         | État                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 0 — Cadrage        | Brief, naming, directions artistiques, architecture, schéma                                     | ✅ Terminée (Kulto, direction 2, décisions validées)             |
| 1 — Fondations     | Projet, design system, navigation, thèmes, Supabase, auth, profils, onboarding, CI              | ✅ Terminée                                                      |
| 2 — Apprentissage  | Contenu « as code », lecteur de leçon, fiches, 5 formats, progression, parcours F1, mode invité | ✅ Terminée (mode invité reporté en 3C)                          |
| 3 — Gamification   | XP, niveaux, série, défi du jour, révisions espacées, badges, ADN culturel, animations          | ✅ Terminée (lots 3A, 3B, 3C)                                    |
| 4 — Compétition    | Cote, divisions, ligues, matchmaking, duels temps réel et asynchrones                           | 🚧 Lots 4A (duels) et 4B (ligues) livrés ; reste 4C (temps réel) |
| 5 — Social         | Amis, invitations, profils publics, duels privés, notifications                                 | À venir                                                          |
| 6 — Administration | Éditeur de contenu, import, publication, événements, modération                                 | À venir                                                          |
| 7 — Enrichissement | Nouveaux formats, nouveaux univers, PWA, événements temporaires                                 | À venir                                                          |
| 8 — Production     | Audit sécurité et accessibilité, CSP, performances, domaine, projet prod                        | À venir                                                          |

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

## Session contenu (28 novembre 2026)

- Quatre nouveaux parcours de 12 leçons (3 chapitres de 3 leçons + 1 épreuve), **en relecture** :
  - Jeux vidéo, « Histoire des consoles » : 26 notions, 54 questions.
  - Musique, « Le rap français » : 30 notions, 56 questions.
  - Cinéma & séries, « Les sagas cultes » : 29 notions, 51 questions.
  - Sport, « La Coupe du monde de football » : 26 notions, 48 questions. Palmarès et records arrêtés à l’issue de 2022 (faits évolutifs) : à mettre à jour avec la Coupe du monde 2026.
- F1 : 48 questions supplémentaires (1 à 2 par notion), en relecture. Elles ne sont dans aucune leçon et serviront aux révisions et au défi du jour une fois publiées.
- Outillage : statut `in_review` possible par question dans un parcours publié (refusé dans une leçon), chargement local de tous les parcours, tests du contenu (`src/features/content/schema.test.ts`).
- Correction : dans les associations, toucher l’élément présélectionné le désélectionnait et faisait perdre le choix suivant.
- Au total : 5 parcours, 60 leçons, 308 questions (51 publiées, 257 en relecture).

## Correctif (28 novembre 2026) : lien de confirmation « expiré »

- Avec le modèle d’email par défaut de Supabase (pas de SMTP personnalisé), le lien confirme l’adresse puis renvoie vers `/auth/callback` avec un code PKCE, utilisable seulement dans le navigateur où le compte a été créé. Ouvert ailleurs (app Mail de l’iPhone, autre appareil), l’app affichait « lien expiré » alors que l’adresse était confirmée.
- Désormais : inscription confirmée depuis un autre navigateur → page de connexion avec « Ton adresse email est confirmée » ; autre lien (mot de passe oublié) → message expliquant d’ouvrir le lien dans le même navigateur. Test E2E qui reproduit le lien par défaut.
- Solution définitive : SMTP personnalisé (Brevo) et nos modèles d’email, dont les liens `token_hash` ne dépendent pas du navigateur.

## Application installable (PWA, 28 novembre 2026)

- Manifeste (`src/app/manifest.ts`) : `scope: '/'`, `display: standalone`, démarrage sur l’accueil, icônes 192/512 et maskable (`public/icons`), icône iPhone (`src/app/apple-icon.png`), réglages `appleWebApp`.
- Corrige l’affichage des barres de Safari dès qu’on changeait de page dans l’app installée (le périmètre était déduit de la page d’installation, faute de manifeste).
- Après déploiement : supprimer l’icône de l’écran d’accueil et la réinstaller, iOS ne relisant le manifeste qu’à l’installation.
- À venir : écran hors ligne (service worker), aide à l’installation, notifications.

## Phase 4 — lot 4A livré (duels asynchrones)

- Duel : 7 questions (quiz, vrai/faux, devine l’année : formats rapides), 15 s chacune, les mêmes pour les deux joueurs, tirées de tout le contenu publié. Chacun joue quand il veut, 48 h pour l’adversaire.
- Trois façons de jouer : duel rapide (adversaire de cote proche ; sinon le duel attend le prochain joueur, jamais de robot), défi par lien (`/d/<code>`, jouable en invité, l’onboarding ramène au défi), revanche.
- Questions servies une par une par le serveur, qui chronomètre (15 s + 0,8 s de tolérance réseau) ; score : 100 × difficulté (1,0 à 1,5), bonus de vitesse plafonné à 25 %, bonus de série plafonné à +30, erreur ou temps écoulé = 0.
- Cote cachée Elo (K = 40 pour les 20 premiers duels, puis 24). XP : 10 pour sa manche, +10 pour une victoire. Une manche jouée valide la série. Forfait si l’adversaire ne joue pas à temps (balayage pg_cron toutes les 15 minutes).
- Interface : section Duels dans Jouer (duel rapide, défier un ami, liste « à toi de jouer » / en attente / terminés), lecteur chronométré, résultat question par question, revanche, partage du lien.
- Tests : 55 unitaires, 165 assertions pgTAP, 30 scénarios E2E (dont deux joueurs et lien de défi en invité).

## Phase 4 — lot 4B livré (ligues hebdomadaires)

- Semaine du lundi 0 h au dimanche 23 h 59 (Paris). Six divisions : Bronze, Argent, Or, Platine, Diamant, Légende. Groupes de 30 joueurs maximum de la même division, rejoints au premier point de la semaine (duel ou défi du jour). Les invités ne participent pas.
- Points : duel gagné 30, nul 15, perdu 5, forfait 0 ; défi du jour 20. Seuls les 15 meilleurs duels de la semaine comptent. Attribués par des triggers sur `duels` et `practice_sessions`.
- Fin de semaine (pg_cron toutes les heures, et à l’ouverture de la page) : classement final, environ 20 % montent et 20 % descendent par groupe (petits groupes : seul le premier monte), jamais sous Bronze ni au-dessus de Légende.
- Page Ligue : division, compte à rebours, points et duels comptés, classement du groupe avec zones de montée et de descente, bilan de la semaine passée, règles. Respecte « apparaître dans les classements » et le profil privé (« Joueur masqué »). Division affichée sur le profil.
- Tests : 57 unitaires, 186 assertions pgTAP, 34 scénarios E2E.

## Lot Sensations (28 novembre 2026)

- Labo son et animation (artifact) : trois directions, choix de Tim enregistré (Premium, avec défaite, flamme et vague en Doux).
- Moteur de sons et vibrations, réglages « Effets sonores » et « Vibrations » désormais effectifs, effets de jeu (éclat, combo, confettis, intro VS, battement du chrono), appui élastique, barre d’onglets à ressort, cibles tactiles de 44 px. Détails : `docs/DESIGN_SYSTEM.md`.

## Écarts et points ouverts

- **À reprendre (signalé par Tim, 28 novembre 2026)** :
  - Création de compte : il reste un problème (à reproduire avec Tim ; probablement lié aux emails sans SMTP personnalisé).
  - Pseudos des invités : un compte invité réserve son pseudo, qui devient indisponible pour un vrai joueur même si l’invité ne crée jamais de compte. Pistes : pseudo provisoire pour les invités (choisi à la sauvegarde), ou libération du pseudo à la purge des invités inactifs.

- **Emails en production** : sans SMTP personnalisé (Brevo), Supabase n'envoie les emails qu'aux membres de l'équipe du projet et refuse la personnalisation des modèles. Indispensable avant d'ouvrir à d'autres joueurs (inscription, mot de passe oublié, sauvegarde d'un compte invité).
- **Mini-test de placement** de l'onboarding : phase 3.
- **Indices** pendant les leçons : reportés (non prioritaires, les révisions jouent le rôle de rattrapage).
- **Contenu** : les 4 parcours de la session contenu sont publiés (validés par Tim le 28 novembre 2026). Restent en relecture les 48 questions supplémentaires du F1.
- **Changement d'adresse email** : non inclus en phase 1 (le modèle d'email est prêt).
- **Pages légales** : brouillons à faire valider juridiquement avant toute ouverture publique.
- **Marque Kulto** : disponibilité (INPI, EUIPO, domaines) à vérifier.
