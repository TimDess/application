# Produit

## Vision

Le « Duolingo de la culture populaire et générale » : apprendre chaque jour sur les sujets qui nous passionnent, par le jeu et la compétition, sans jamais avoir l'impression d'être à l'école.

Promesse : **Développe ta culture. Explore tes passions. Défie tes amis.**

## Cible

- Principale : 16-25 ans, étudiants et jeunes actifs, passionnés de culture pop, joueurs occasionnels ou réguliers.
- Secondaire : adultes curieux, groupes d'amis, communautés de passionnés.
- Âge minimum : 15 ans (consentement numérique en France).

## Trois boucles

1. **Quotidienne** (3 à 10 min) : défi du jour, une leçon, quelques révisions.
2. **Progression** (semaines) : parcours, chapitres, boss, maîtrise par univers.
3. **Statut** (saison) : ligues hebdomadaires, duels, amis, ADN culturel.

## Organisation pédagogique

Univers → Catégorie → Parcours → Chapitre → Leçon → Activités. Côté interface, trois niveaux d'écrans seulement : page univers, page parcours, lecteur de leçon. Une **notion** (fait ou concept atomique) est présentée par les fiches et testée par plusieurs questions : les révisions portent sur la notion, pas sur la question.

## Fonctionnalités disponibles (phase 1)

- Inscription email + mot de passe, confirmation par email, connexion, déconnexion, mot de passe oublié, changement de mot de passe.
- Consentement (âge, conditions) enregistré côté serveur.
- Onboarding : pseudo, avatar, univers favoris, objectif quotidien, niveau estimé par univers.
- Accueil personnalisé, page Explorer (9 univers), Jouer et Ligue (présentation des modes à venir), Profil.
- Paramètres enregistrés automatiquement : thème clair / sombre / automatique, réduction des animations, avatar, objectif, univers favoris, sons et vibrations, confidentialité.
- Export des données (JSON) et suppression immédiate du compte.

## Décisions produit validées (phase 0)

| Sujet                   | Décision                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Nom                     | Kulto (marque à vérifier)                                                                                            |
| Direction artistique    | Direction 2 : fond nuit, accent Soleil, Inter + Inter Tight, cartes sobres                                           |
| Logique métier critique | Fonctions Postgres transactionnelles                                                                                 |
| Compétition             | Cote cachée pour le matchmaking, divisions visibles via ligues hebdomadaires, 15 meilleurs duels comptés par semaine |
| Duels                   | Temps réel et asynchrones dès la phase 4                                                                             |
| Mode invité             | Comptes anonymes Supabase, activité avant création de compte (avec la première leçon, phase 2)                       |
| Contenu                 | « As code » (JSON validé dans le repo) en V1, administration en phase 6                                              |
| Formats V1              | Quiz, Vrai/Faux, Match, Timeline, Guess The Year ; Blind Test et Pixel Reveal reportés (droits)                      |
| Mineurs                 | 15 ans minimum, avatars prédéfinis, pas d'upload ni de messagerie libre                                              |
| Langue                  | Français au lancement, interface prête pour l'i18n                                                                   |
