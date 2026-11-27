# Multijoueur (prévu en phase 4)

Statut : **conception**, rien n'est implémenté.

## Modèle

- Le duel est une **machine à états en base** : `waiting → matched → ready → in_progress → completed | cancelled | abandoned`, transitions vérifiées par une seule fonction.
- Chaque manche a une `deadline_at` fixée par le serveur ; une réponse arrivée après la deadline (avec une tolérance réseau d'environ 500 ms) est refusée.
- Pas de serveur de jeu permanent : n'importe quel client appelle `advance_match()` (idempotent, verrou de ligne) quand les deux joueurs ont répondu ou que la deadline est passée. `pg_cron` balaie les matchs bloqués.
- **Supabase Realtime** (canaux privés autorisés par RLS, Broadcast depuis la base + Presence) notifie ; la base décide.
- Reconnexion : relecture complète de l'état par RPC, puis réabonnement.
- Duels asynchrones dès la phase 4 pour éviter les files d'attente vides au lancement. Jamais de bot présenté comme un humain.

## Score

100 points × difficulté (1,0 à 1,5) si la réponse est correcte, bonus de vitesse plafonné à 25 %, bonus de série plafonné à +30. Une erreur rapporte 0.

## Compétition

Cote cachée (Elo à K dynamique en V1) pour le matchmaking ; divisions visibles (Bronze → Légende) via les ligues hebdomadaires ; seuls les 15 meilleurs duels de la semaine comptent.
