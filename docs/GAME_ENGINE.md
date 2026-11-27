# Moteur de jeu et contenu

Statut : **en place depuis la phase 2** (5 formats, lecteur de leçon, progression).

## Chaîne du contenu

```
content/<univers>/<parcours>.json   ← rédaction (relue en pull request)
        │  pnpm content:build        validation Zod (src/features/content/schema.ts)
        ▼
supabase/content/<parcours>.sql     ← SQL idempotent, IDs déterministes
        │  appliqué en local (pnpm content:local, statut forcé à published)
        ▼  ou sur Supabase (Management API / SQL editor)
Postgres : questions (public) + private.question_solutions (privé)
```

- Les IDs sont dérivés des slugs et clés : réappliquer le SQL met à jour sans casser la progression des joueurs.
- Une leçon retirée du fichier est **archivée**, jamais supprimée.
- La validation refuse : notion inconnue, fait évolutif sans `validAsOf`, question en double, leçon sans fiche, année hors bornes.
- La CI vérifie que `supabase/content/*.sql` correspond bien aux fichiers JSON.

### Statuts et relecture

`draft` → `in_review` → `published`. Le contenu rédigé par IA arrive en `in_review` : il n'est visible que des comptes ayant le rôle `editor` ou `admin` (`private.is_reviewer()`), qui peuvent le jouer dans l'application réelle avant publication.

## Formats

| Format       | Payload public                          | Solution privée       | Réponse envoyée   | Score                                                                 |
| ------------ | --------------------------------------- | --------------------- | ----------------- | --------------------------------------------------------------------- |
| `quiz`       | options `{id,label}`, `multiple`        | `correct: [ids]`      | `selected: [ids]` | tout ou rien                                                          |
| `true_false` | —                                       | `value`               | `value`           | tout ou rien                                                          |
| `match`      | `left`, `right` (mélangé)               | `pairs {left: right}` | `pairs`           | proportion de paires justes                                           |
| `timeline`   | `items` (mélangés, jamais dans l'ordre) | `order`, `dates`      | `order`           | proportion de positions justes                                        |
| `guess_year` | `min`, `max`                            | `year`, `tolerance`   | `year`            | juste si écart ≤ tolérance ; score décroissant jusqu'à 10 ans d'écart |

Le score est calculé par `private.evaluate_answer()` et la forme de la réponse est vérifiée par `private.answer_is_well_formed()` (testés avec pgTAP).

## Session de leçon

1. `start_lesson(lesson)` : vérifie que la leçon est visible et **débloquée** (première du parcours ou précédente terminée), reprend la session ouverte des dernières 24 h ou en crée une avec la liste figée des questions.
2. `submit_answer(session, question, answer)` : une seule tentative par question (`UNIQUE (session_id, question_id)`) ; une nouvelle soumission renvoie le premier résultat. Renvoie correction et explication, jamais avant.
3. `complete_lesson(session)` : exige toutes les réponses, calcule le score, met à jour `user_lesson_progress` (meilleur score, tentatives) et `user_course_progress`, puis attribue les récompenses (XP, niveaux, objectif du jour, série) et les renvoie dans `rewards`. Idempotent : un second appel renvoie le même résumé.

## Récompenses (phase 3A)

| Récompense       | XP                 | Source unique |
| ---------------- | ------------------ | ------------- |
| Bonne réponse    | 10 × score (0 à 1) | question      |
| Leçon terminée   | 50                 | leçon         |
| Sans faute       | 20                 | leçon         |
| Épreuve réussie  | 100 (score ≥ 70)   | leçon         |
| Chapitre terminé | 150                | chapitre      |

Série : `private.register_activity` avance la série d'un jour si le dernier jour actif est la veille ; s'il manque des jours et qu'il reste assez de protections, elles sont consommées (jours marqués `frozen`) ; sinon la série repart à 1. Une protection est gagnée à chaque multiple de 7 jours, 2 au maximum.

## Révisions et défi du jour (phase 3B)

- **Leitner** : boîtes 1 à 7, intervalles dans `game_config.review_intervals`. Bonne réponse en révision → boîte suivante ; erreur → boîte 1. Une leçon terminée ajoute ses notions en boîte 1 (ou renvoie en boîte 1 une notion ratée).
- **Choix de la question** : `private.notion_question` prend une question visible liée à la notion, en évitant la dernière posée.
- **Défi du jour** : `private.ensure_daily_challenge(jour)` tire 5 questions publiées (graine = jour, réparties entre univers) et les fige dans `daily_challenges` ; tout le monde reçoit les mêmes. Une session de défi par joueur (index unique).
- **Récompenses** : `complete_practice` (révision : 5 XP par bonne réponse + 30 ; défi : 50), objectif du jour et série comme pour une leçon. L'XP de pratique n'est pas rattachée à un univers.
- **Interface** : `src/features/practice/practice-player.tsx`. Les pages rendent toujours le lecteur (avec un état `idle` quand il n'y a rien à jouer) pour que le rafraîchissement après la fin n'efface pas l'écran de résultat.

## Interface

- `src/components/games/*` : un composant par format, branché dans le registre `question-view.tsx`. Tout est utilisable au clavier ; les frises se réordonnent avec des boutons (alternative au glisser-déposer), les associations se font par sélection successive.
- `src/components/learning/lesson-player.tsx` : intro → fiches → questions (correction + explication) → résultat. La progression est sauvegardée à chaque réponse : quitter puis revenir reprend à la première question sans réponse.

## Ajouter un format

1. Ajouter la valeur à l'enum `question_format` (migration), et ses règles dans `answer_is_well_formed` / `evaluate_answer` + tests pgTAP.
2. Ajouter son schéma dans `src/features/content/schema.ts` et sa compilation dans `scripts/content-build.mts`.
3. Créer le composant dans `src/components/games/` et l'ajouter au registre.
