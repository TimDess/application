# Architecture

## Vue d'ensemble

```
Navigateur ──► src/proxy.ts (rafraîchit la session, redirections optimistes)
          ──► Pages (Server Components, streaming sous Suspense)
          ──► Server Actions (Zod + requireUser) ──► Supabase (JWT de l'utilisateur, RLS)
                                                   └─► RPC Postgres SECURITY DEFINER (écritures sensibles)
```

- **Postgres est la source de vérité.** Les écritures sensibles passent par des fonctions SQL transactionnelles (`complete_onboarding`, `set_universe_preferences`, puis XP, scores, duels).
- **Le client admin** (clé secrète) ne sert qu'à la suppression de compte, après revérification du mot de passe.

## Next.js 16 et Cache Components

`cacheComponents` et `partialPrefetching` sont activés (valeurs par défaut de Next 16.4).

- Les pages publiques sont **statiques** (landing, CGU, confidentialité, formulaires d'auth).
- Les pages de l'application sont en **prérendu partiel** : le shell (navigation) est statique, tout ce qui lit la session est streamé sous `<Suspense>`.
- `createClient()` (`src/lib/supabase/server.ts`) appelle `connection()` : la session n'est jamais lue pendant un prérendu (supabase-js utilise `Date.now()`, interdit en prérendu).
- Le thème est appliqué avant le premier rendu par un script inline qui lit un cookie côté client (`src/components/theme/theme-script.tsx`), ce qui garde le layout racine statique.

## Organisation

```
src/
  app/
    (marketing)/     landing, cgu, confidentialite
    (auth)/          connexion, inscription, mot-de-passe-oublie, reinitialiser-mot-de-passe, auth/erreur
    (app)/           accueil, explorer, jouer, ligue, profil, parametres(/compte) + layout (shell, AuthGate)
    onboarding/      parcours d'accueil (connecté, sans navigation)
    auth/confirm     vérification token_hash (liens des emails)
    auth/callback    échange de code PKCE
    api/compte/export export RGPD
  components/
    ui/              design system (Button, TextField, PasswordField, ChoiceGroup, Switch, Card, Pill, Progress, Avatar…)
    layout/          navigation (BottomNav, SideNav, MobileHeader), en-têtes, squelettes
    theme/           script anti-flash, synchronisation des préférences
  features/
    auth/            actions, formulaires, traduction des erreurs
    account/         changement de mot de passe, suppression
    onboarding/      flux en 5 étapes
    settings/        paramètres, sélection des univers
    universes/       icônes, couleurs, tuiles
  lib/
    auth/session.ts  Data Access Layer : getSessionUser, requireUser, getViewer, getPublishedUniverses
    supabase/        clients serveur et admin, variables publiques
    validation/      schémas Zod, ActionState
    utils/           cn, contraste WCAG
  config/            brand, routes, product, avatars
  types/database.ts  types générés (pnpm db:types)
  proxy.ts
supabase/
  migrations/        schéma versionné
  tests/database/    pgTAP
  templates/         emails d'authentification (français)
tests/e2e/           Playwright
```

## Flux d'authentification

1. Inscription : `signUpAction` → `supabase.auth.signUp` avec le consentement en métadonnées → email de confirmation.
2. Le lien de l'email pointe vers `/auth/confirm?token_hash=…&type=email&next=/onboarding` → `verifyOtp` → session ouverte.
3. `getViewer()` charge profil, paramètres, onboarding et univers favoris en parallèle (mémoïsé par requête avec `React.cache`).
4. `AuthGate` (layout de l'app) redirige vers `/onboarding` tant que l'onboarding n'est pas terminé.
5. L'onboarding appelle la RPC `complete_onboarding` (une seule transaction).

## Tests

| Niveau                   | Outil                         | Emplacement               |
| ------------------------ | ----------------------------- | ------------------------- |
| Unitaires                | Vitest                        | `src/**/*.test.ts`        |
| Sécurité base de données | pgTAP                         | `supabase/tests/database` |
| Bout en bout             | Playwright (mobile + desktop) | `tests/e2e`               |

La CI (`.github/workflows/ci.yml`) exécute les trois sur chaque pull request.
