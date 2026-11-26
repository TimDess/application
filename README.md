# Kulto

> Développe ta culture. Explore tes passions. Défie tes amis.

Kulto est une application web d'apprentissage de la culture populaire et générale par le jeu : parcours courts, mini-jeux, révisions espacées, défis quotidiens, ligues et duels. Formule 1, musique, jeux vidéo, cinéma et plus encore.

**État : Phase 1 (fondations) terminée.** Comptes, onboarding, profil, paramètres, thèmes clair/sombre et design system sont fonctionnels. Les parcours et mini-jeux arrivent en phase 2. Voir [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth) · Zod · Vitest · pgTAP · Playwright · Vercel.

## Démarrer en local

Prérequis : Node 22+, pnpm 10 (`corepack enable`), Docker.

```bash
pnpm install
```

```bash
pnpm db:start
```

Copie `.env.example` en `.env.local` et renseigne les valeurs affichées par `pnpm db:start` (URL de l'API, clé publishable, clé secrète locale).

```bash
pnpm dev
```

L'application tourne sur http://localhost:3000 et les emails de test (confirmation, mot de passe) arrivent dans Mailpit : http://127.0.0.1:54324.

> Si le téléchargement des images Supabase échoue (registre `public.ecr.aws` bloqué), préfixe la commande avec `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`.

## Scripts

| Commande                    | Rôle                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`                  | Serveur de développement                                                           |
| `pnpm build` / `pnpm start` | Build et serveur de production                                                     |
| `pnpm check`                | Typecheck + lint + tests unitaires                                                 |
| `pnpm test`                 | Tests unitaires (Vitest)                                                           |
| `pnpm test:e2e`             | Tests de bout en bout (Playwright, Supabase local requis)                          |
| `pnpm db:start` / `db:stop` | Démarre / arrête Supabase en local                                                 |
| `pnpm db:reset`             | Réapplique migrations et seed en local                                             |
| `pnpm db:test`              | Tests de sécurité SQL (pgTAP)                                                      |
| `pnpm db:types`             | Régénère les types TypeScript de la base                                           |
| `pnpm db:push`              | Applique les migrations au projet Supabase lié (environnement autorisé uniquement) |
| `pnpm format`               | Formate le code (Prettier)                                                         |

## Documentation

| Fichier                                          | Contenu                                          |
| ------------------------------------------------ | ------------------------------------------------ |
| [`CLAUDE.md`](CLAUDE.md)                         | Règles permanentes du projet (à lire en premier) |
| [`docs/PRODUCT.md`](docs/PRODUCT.md)             | Vision, cible, fonctionnalités                   |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)   | Organisation du code et flux de données          |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, typographie, composants                  |
| [`docs/DATABASE.md`](docs/DATABASE.md)           | Schéma, RLS, fonctions                           |
| [`docs/SECURITY.md`](docs/SECURITY.md)           | Modèle de sécurité                               |
| [`docs/GAME_ENGINE.md`](docs/GAME_ENGINE.md)     | Moteur de mini-jeux (phase 2)                    |
| [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md)     | Duels et temps réel (phase 4)                    |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)       | Supabase, Vercel, variables d'environnement      |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)             | Phases et état d'avancement                      |
| [`docs/PHASE_0_BRIEF.md`](docs/PHASE_0_BRIEF.md) | Brief de cadrage initial                         |
