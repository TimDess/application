# Moteur de mini-jeux (prévu en phase 2)

Statut : **conception**, rien n'est implémenté.

## Principes

- Chaque format est un module isolé qui implémente une interface commune : rendu de la question, saisie de la réponse, feedback, alternative accessible (clavier, sans glisser-déposer).
- Un registre de formats associe `questions.format` à son module : ajouter un format revient à ajouter un dossier, sans toucher au lecteur de leçon.
- **Les solutions ne sont jamais envoyées au client.** La question part sans indice de réponse ; la RPC de soumission renvoie correct / incorrect et l'explication.
- Les données de chaque format sont en JSONB (`questions.payload` public, `private.question_solutions.solution` privé), validées par un schéma Zod par format à l'import.

## Formats V1

Quiz (choix unique ou multiple), Vrai/Faux, Match (associations), Timeline (ordre chronologique), Guess The Year (score selon la proximité).

## Session de leçon

`lesson_sessions` fige la liste des questions au démarrage ; `question_attempts` porte une contrainte `UNIQUE (session_id, question_id)` ; la clôture attribue l'XP une seule fois (`UNIQUE` sur `xp_transactions`).

Détails et règles chiffrées : `docs/PHASE_0_BRIEF.md`, sections 6.3 et 7.3.
