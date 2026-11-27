# Sécurité

## Principes

1. **Le serveur décide.** Aucune valeur critique (XP, score, résultat, rang, badge, progression) n'est acceptée du client. Les écritures sensibles sont des fonctions Postgres transactionnelles et idempotentes.
2. **Moindre privilège.** RLS sur toutes les tables, privilèges colonne par colonne, fonctions `SECURITY DEFINER` avec `search_path` vide et `auth.uid()` vérifié, `execute` retiré à `public` et `anon`.
3. **L'identité vient du JWT**, jamais d'un identifiant envoyé par le navigateur.
4. **Chaque Server Action et Route Handler revérifie la session** (`requireUser`), même si le proxy a déjà redirigé.

## Authentification

- Supabase Auth gère les mots de passe (hachage bcrypt côté Supabase) : aucun mot de passe dans nos tables ni dans les logs.
- Politique : 8 caractères minimum, lettres et chiffres (validation Zod côté serveur, identique à la configuration Supabase).
- Confirmation de l'adresse email obligatoire avant la première connexion.
- Changement de mot de passe : mot de passe actuel exigé (`require_current_password`).
- Suppression de compte : mot de passe revérifié avec un client sans état, puis suppression par l'API admin (cascade sur toutes les données).
- Messages d'erreur génériques : on ne révèle jamais si une adresse possède un compte (inscription, mot de passe oublié, renvoi d'email).
- Redirections après connexion filtrées (`safeNextPath`) contre les redirections ouvertes.

## Secrets et variables

| Variable                               | Exposée au navigateur  | Où                                                              |
| -------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Oui                    | —                                                               |
| `NEXT_PUBLIC_SUPABASE_URL`             | Oui                    | —                                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Oui (protégée par RLS) | —                                                               |
| `SUPABASE_SECRET_KEY`                  | **Non**                | Uniquement `src/lib/supabase/admin.ts` (`import 'server-only'`) |

`.env*` est ignoré par Git (sauf `.env.example`). Les secrets de production vivent dans Vercel et GitHub Actions, jamais dans le code ni dans une conversation.

## En-têtes HTTP

`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictive, en-tête `X-Powered-By` supprimé. Une Content Security Policy complète est prévue en phase 8.

## Mineurs et modération

15 ans minimum (case obligatoire, date de consentement enregistrée), pseudos réservés filtrés, avatars prédéfinis (pas d'upload), aucune messagerie libre en V1.

## Données personnelles

Collecte minimale (email, pseudo, préférences, consentement). Export JSON et suppression immédiate depuis Paramètres, Compte. Hébergement Supabase en région UE (à choisir à la création du projet).

## À venir

CAPTCHA (Cloudflare Turnstile) sur l'inscription et le mode invité (phase 2), limitation de débit sur les actions de jeu, journal d'audit admin (phase 6), audit complet et CSP (phase 8).
