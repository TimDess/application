# Déploiement

Workflow : développement local → Git → GitHub (pull request, CI) → Vercel (preview par branche, production sur `main`) ↔ Supabase.

## 1. Supabase (projet « dev » d'abord, « prod » en phase 8)

1. Créer un projet sur supabase.com en **région UE** (Paris `eu-west-3` ou Francfort). Noter le mot de passe de la base dans un gestionnaire de mots de passe.
2. **Authentication → URL Configuration** :
   - Site URL : l'URL de l'application (par exemple l'URL de production Vercel).
   - Redirect URLs : `http://localhost:3000/**` et `https://*-<équipe>.vercel.app/**` pour les previews.
3. **Authentication → Providers → Email** : activer « Confirm email », longueur minimale 8, exigence « lettres et chiffres ».
4. **Authentication → Email Templates** : sur l'offre gratuite, Supabase n'autorise la personnalisation des modèles qu'avec un SMTP configuré (étape 5). Sans SMTP, les emails standards (en anglais) fonctionnent : leurs liens passent par `/auth/callback` (PKCE), testé de bout en bout. Avec SMTP, reprendre `supabase/templates/*.html` (liens vers `/auth/confirm?token_hash=…`).
5. **SMTP** : depuis 2024, l'envoi d'emails par défaut de Supabase est réservé aux membres de l'équipe et très limité. Pour de vrais utilisateurs, configurer un SMTP (Brevo ou Resend) dans **Project Settings → Authentication → SMTP**.
6. Appliquer les migrations (environnement autorisé uniquement) :

```bash
pnpm exec supabase link --project-ref <ref>
```

```bash
pnpm db:push
```

## 2. Vercel

1. Importer le dépôt GitHub dans Vercel (framework détecté : Next.js, gestionnaire pnpm).
2. Variables d'environnement (Settings → Environment Variables) :

| Variable                               | Preview                        | Production              |
| -------------------------------------- | ------------------------------ | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` (facultatif)    | URL de preview ou laisser vide | URL de production       |
| `NEXT_PUBLIC_SUPABASE_URL`             | projet dev                     | projet prod             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | projet dev                     | projet prod             |
| `SUPABASE_SECRET_KEY`                  | projet dev (Sensitive)         | projet prod (Sensitive) |

3. Chaque pull request obtient une preview ; `main` part en production.

> Le plan Hobby de Vercel est réservé à un usage non commercial : passer au plan Pro si le projet devient commercial.

## 3. GitHub

- Protéger `main` : pull request obligatoire, CI verte (`Types, lint, unit tests, build` et `Database security tests and end-to-end`).
- La CI démarre un Supabase local jetable : elle ne touche jamais aux projets dev ou prod.

## Règles

- Jamais de tests destructifs sur la base de production.
- Jamais de secret dans le code, les issues, les logs ou une conversation.
