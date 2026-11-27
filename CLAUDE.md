# CLAUDE.md — Kulto

Instructions permanentes pour toute session de développement sur ce dépôt. Lis aussi `AGENTS.md` (règles Next.js) et `docs/ROADMAP.md` (état du projet) avant de coder.

## Produit

Kulto est le « Duolingo de la culture populaire et générale » : parcours courts, mini-jeux, révisions espacées, compétition. Cible 16-25 ans, français d'abord. Détails : `docs/PRODUCT.md`. Brief de cadrage : `docs/PHASE_0_BRIEF.md`.

## Stack

- Next.js 16.4 (App Router, **Cache Components** et **Partial Prefetching** activés), React 19.3, TypeScript 5.9 strict.
- Tailwind CSS 4.3 (tokens dans `src/app/globals.css`), Radix Slot, lucide-react.
- Supabase : Postgres 17, Auth, (Realtime et Storage à venir). `@supabase/ssr` 0.12, `supabase-js` 2.119.
- Zod 4 pour toute validation. Vitest 5, pgTAP, Playwright 1.63.
- pnpm 10, Node 22.

**Next 16 diffère de tes connaissances** : `middleware.ts` s'appelle `src/proxy.ts`, `next lint` n'existe plus, et avec Cache Components toute lecture de cookies ou de session doit se trouver sous un `<Suspense>`. Consulte `node_modules/next/dist/docs/` avant d'utiliser une API Next.

## Commandes

```bash
pnpm dev              # serveur de dev (http://localhost:3000)
pnpm check            # typecheck + lint + tests unitaires
pnpm build            # build de production
pnpm test:e2e         # Playwright (nécessite pnpm db:start)
pnpm db:start         # Supabase local (Docker). Si public.ecr.aws est bloqué : SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io
pnpm db:reset         # réapplique migrations + seed en local
pnpm db:test          # tests pgTAP via supabase (ou pnpm db:test:psql si l'image pg_prove est indisponible)
pnpm db:types         # régénère src/types/database.ts après une migration
pnpm format           # Prettier
pnpm content:build    # valide content/*.json et génère supabase/content/*.sql
pnpm content:local    # charge le contenu en local (statut forcé à published)
```

## Architecture (résumé, détail dans `docs/ARCHITECTURE.md`)

```
src/app/(marketing)  pages publiques statiques (landing, CGU, confidentialité)
src/app/(auth)       connexion, inscription, mots de passe
src/app/(app)        application connectée (shell + navigation, AuthGate)
src/app/onboarding   onboarding (connecté, hors shell)
src/app/auth/*       route handlers de confirmation email (token_hash, PKCE)
src/components/ui    design system (aucune logique métier)
src/features/*       logique par domaine : actions serveur, formulaires, composants métier
src/lib/auth         Data Access Layer (seul endroit qui lit la session)
src/lib/supabase     clients serveur / admin
src/lib/validation   schémas Zod partagés
src/config           marque, routes, options produit (source unique)
src/components/games mini-jeux (un composant par format) ; src/components/learning : lecteur de leçon
content/             contenu pédagogique « as code » (JSON)
supabase/migrations  schéma SQL versionné ; supabase/tests : pgTAP
```

## Règles non négociables

1. **Postgres est l'arbitre.** Tout ce qui attribue quelque chose (XP, points, badges, résultats, progression) passe par une fonction Postgres transactionnelle et idempotente. Jamais de valeur critique décidée par le client.
2. **RLS partout.** Chaque table de `public` a RLS activée, des politiques explicites et des privilèges colonne par colonne. Toute nouvelle table arrive avec ses tests pgTAP (accès autorisé ET refusé).
3. **Fonctions SECURITY DEFINER** : `set search_path = ''`, vérification explicite de `auth.uid()`, `revoke execute ... from public, anon`. Les helpers internes vont dans le schéma `private`.
4. **Les bonnes réponses ne quittent jamais le serveur** : solutions et explications dans `private.question_solutions`, scoring dans `private.evaluate_answer()`.
5. **Contenu** : toujours via `content/*.json` + `pnpm content:build`, jamais à la main en base. Le contenu rédigé par IA reste `in_review` jusqu'à validation humaine.
6. **Secrets** : seul `SUPABASE_SECRET_KEY` est secret, uniquement dans `src/lib/supabase/admin.ts` (`server-only`). Jamais de `NEXT_PUBLIC_` sur un secret, jamais de secret dans le code, les logs ou le chat.
7. **Session** : lue uniquement via `src/lib/auth/session.ts`. Chaque Server Action et Route Handler revérifie l'utilisateur (`requireUser`).
8. **Nom de marque** : jamais en dur, toujours `brand` depuis `src/config/brand.ts`.
9. **Pas de faux** : pas de bouton sans fonction (sinon `SoonBadge` avec la phase), pas de données fictives présentées comme réelles, pas de localStorage pour simuler le backend.
10. **Accessibilité** : labels explicites, `id` uniques par champ, focus visibles, alternatives au glisser-déposer, couleur jamais seule porteuse d'information, `prefers-reduced-motion` et réglage in-app respectés.
11. **Design** : direction 2 (voir `docs/DESIGN_SYSTEM.md`). Inter + Inter Tight, 4 tailles de texte, hiérarchie par la graisse et la couleur, une seule couleur vive par carte, rayon 14 px, aucun italique, aucune inclinaison.

## Conventions

- Code, identifiants et commentaires en anglais ; textes d'interface en français, tutoiement.
- Server Components par défaut ; `'use client'` seulement pour l'interactivité.
- Formulaires : Server Action + `useActionState`, retour `ActionState` (`src/lib/validation/action-state.ts`).
- Erreurs Supabase traduites via `src/features/auth/errors.ts` : jamais d'erreur brute affichée.
- Commits conventionnels (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Une migration ne se modifie plus une fois poussée : on en ajoute une nouvelle.

## Critères de qualité avant de dire « terminé »

`pnpm check`, `pnpm build`, tests pgTAP et E2E verts ; écran vérifié sur mobile et desktop, en clair et en sombre ; documentation (`docs/ROADMAP.md` au minimum) mise à jour.
