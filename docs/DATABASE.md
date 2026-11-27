# Base de données

Postgres 17 (Supabase). Migrations dans `supabase/migrations`, tests pgTAP dans `supabase/tests/database`.

## Conventions

- `uuid` en clé primaire, `timestamptz` partout, `created_at` / `updated_at` (trigger `private.set_updated_at`).
- Enums pour les statuts, contraintes `CHECK` pour les valeurs fermées.
- RLS sur **toutes** les tables de `public` (vérifié par un test).
- Privilèges explicites : `revoke all` puis `grant` minimal, colonne par colonne pour les `update`.
- Schéma `private` non exposé par l'API pour les helpers et, dès la phase 2, les solutions des questions.
- Les données utilisateur référencent `auth.users(id)` avec `on delete cascade` : supprimer le compte supprime tout.

## Tables (phase 1)

| Table                       | Contenu                                                                              | Lecture                                  | Écriture                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `universes`                 | Les 9 univers (slug, nom, couleurs clair/sombre, icône, ordre, statut)               | Tout le monde si publié                  | Aucune via l'API (admin en phase 6)                                               |
| `profiles`                  | Identité publique : pseudo (citext unique), avatar, visibilité                       | Soi-même, ou profils publics avec pseudo | `avatar_key`, `visibility` par le propriétaire ; pseudo via `complete_onboarding` |
| `user_settings`             | Thème, animations, sons, vibrations, objectif, fuseau, classements, **consentement** | Soi-même                                 | Préférences par le propriétaire ; consentement jamais modifiable                  |
| `user_universe_preferences` | Univers favoris et niveau estimé                                                     | Soi-même                                 | Via `set_universe_preferences` / `complete_onboarding`                            |
| `user_onboarding`           | Date de fin d'onboarding                                                             | Soi-même                                 | Via `complete_onboarding`                                                         |
| `user_roles`                | Rôles admin / éditeur / modérateur                                                   | Soi-même                                 | Aucune via l'API                                                                  |

## Fonctions

| Fonction                                                        | Rôle                                                                                                                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `private.handle_new_user()`                                     | Trigger sur `auth.users` : crée profil, paramètres (avec consentement issu des métadonnées d'inscription) et état d'onboarding                                   |
| `private.validate_profile_username()`                           | Refuse les pseudos réservés (liste partagée avec `src/config/product.ts`)                                                                                        |
| `public.complete_onboarding(username, avatar, goal, universes)` | Enregistre tout l'onboarding en une transaction. Erreurs : `username_taken` (23505), `username_reserved`, `invalid_universes` (22023), objectif invalide (23514) |
| `public.set_universe_preferences(universes)`                    | Remplace atomiquement les univers favoris (slugs publiés, sans doublon)                                                                                          |
| `public.has_role(role)`                                         | Vrai si l'utilisateur courant a le rôle                                                                                                                          |

## Tests pgTAP (124 assertions)

RLS active partout ; univers publiés seulement pour les anonymes ; isolement entre utilisateurs ; impossibilité de forger le consentement, de changer de pseudo hors fonction, de s'attribuer un rôle ou d'écrire directement ses préférences ; unicité insensible à la casse ; pseudos réservés ; suppression en cascade.

```bash
pnpm db:test        # via le CLI Supabase
pnpm db:test:psql   # même suite via psql (si l'image pg_prove ne peut pas être téléchargée)
```

## Tables (phase 2)

| Groupe      | Tables                                                                                                                                       | Accès                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Contenu     | `categories`, `courses`, `chapters`, `lessons`, `knowledge_items`, `learning_cards`, `questions`, `question_knowledge_items`, `lesson_items` | Lecture si publié (ou `in_review` pour les relecteurs), aucune écriture via l'API |
| Privé       | `private.question_solutions` (solution + explication)                                                                                        | Aucun accès client                                                                |
| Progression | `lesson_sessions`, `question_attempts`, `user_lesson_progress`, `user_course_progress`                                                       | Lecture par le propriétaire, écriture par les RPC uniquement                      |

RPC : `start_lesson`, `submit_answer`, `complete_lesson` (détails dans `docs/GAME_ENGINE.md`).

## Tables (phase 3A)

| Table                 | Rôle                                                                         | Accès                                        |
| --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| `game_config`         | Valeurs d'XP, courbe de niveaux, objectif, protections de série              | Lecture pour tous, aucune écriture via l'API |
| `xp_transactions`     | Une ligne par récompense, `UNIQUE (user_id, reason, source_type, source_id)` | Lecture par le propriétaire                  |
| `user_stats`          | XP totale, niveau, leçons terminées                                          | Lecture par le propriétaire                  |
| `user_universe_stats` | XP et niveau par univers                                                     | Lecture par le propriétaire                  |
| `daily_activity`      | XP et leçons par jour local, objectif atteint, jour protégé                  | Lecture par le propriétaire                  |
| `user_streaks`        | Série actuelle, record, dernier jour actif, protections                      | Lecture par le propriétaire                  |

Seul `complete_lesson` écrit ces tables (via `private.grant_xp` et `private.register_activity`). `lesson_sessions.rewards` garde les récompenses de la session pour qu'un second appel renvoie le même résumé. RPC de lecture : `get_my_progress()` (niveau, jour, série effective calculée sur le jour local, 7 derniers jours, niveaux par univers).

## Tables (phase 3B)

| Table                  | Rôle                                                                                        | Accès                       |
| ---------------------- | ------------------------------------------------------------------------------------------- | --------------------------- |
| `user_knowledge_state` | Boîte de Leitner, prochaine date, compteurs par notion et par joueur                        | Lecture par le propriétaire |
| `daily_challenges`     | Un défi par jour (Paris) : liste figée de questions publiées                                | Lecture pour les connectés  |
| `practice_sessions`    | Sessions de révision et de défi (questions figées, score, récompenses) ; un défi par joueur | Lecture par le propriétaire |
| `practice_attempts`    | Une tentative par question et par session                                                   | Lecture par le propriétaire |

RPC : `start_review`, `start_daily_challenge`, `submit_practice_answer`, `complete_practice`. Un trigger sur `lesson_sessions` amorce les notions à la fin d'une leçon. `get_my_progress` renvoie aussi `reviews` (dues, connues, maîtrisées) et `daily` (fait, score, cases de partage).

## Schéma cible

Les tables des phases suivantes (contenu, progression, gamification, compétition, social) sont décrites dans `docs/PHASE_0_BRIEF.md`, section 7.
