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

## Tests pgTAP (31 assertions)

RLS active partout ; univers publiés seulement pour les anonymes ; isolement entre utilisateurs ; impossibilité de forger le consentement, de changer de pseudo hors fonction, de s'attribuer un rôle ou d'écrire directement ses préférences ; unicité insensible à la casse ; pseudos réservés ; suppression en cascade.

```bash
pnpm db:test        # via le CLI Supabase
pnpm db:test:psql   # même suite via psql (si l'image pg_prove ne peut pas être téléchargée)
```

## Schéma cible

Les tables des phases suivantes (contenu, progression, gamification, compétition, social) sont décrites dans `docs/PHASE_0_BRIEF.md`, section 7.
