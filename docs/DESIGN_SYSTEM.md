# Design system — direction 2, version « Verre et lumière » (A)

Construite à partir des retours sur les trois pistes de la phase 0 : le fond nuit et le caractère de la direction « Collection », la logique de couleur de « Pochette », la barre d'onglets de « Télémétrie », et une typographie simple.

## Verre et lumière (refonte A, novembre 2026)

Choisie parmi trois maquettes (A Verre et lumière, B Pochettes vivantes, C Arcade premium).

- **Lumière** : `AmbientBackground` pose trois halos flous derrière l'interface ; les pages de parcours et de leçon ajoutent un halo teinté par l'univers.
- **Verre** : `.glass` (cartes, listes, réponses) et `.glass-strong` (navigation, panneaux de correction) : fond translucide, flou d'arrière-plan, bordure fine et reflet en haut.
- **Barres qui recouvrent le contenu** (barre d’onglets mobile, en-tête mobile) : `.glass-nav`, quasi opaque, plus un dégradé de la couleur de fond qui estompe le contenu avant qu’il passe dessous. Safari affiche net un élément en verre placé derrière un autre élément en verre : un simple flou ne suffit pas.
- **Grilles** : toujours `grid-cols-1` en base (une colonne `minmax(0, 1fr)`). Sans colonne définie, un texte tronqué sur une ligne élargit la grille au-delà de l’écran.
- **Accent lumineux** : `.glow-accent` sur les boutons principaux.
- **Rayons** : `rounded-card` 22 px, `rounded-hero` 26 px, `rounded-control` 16 px.
- **Navigation mobile** : pilule flottante en verre ; desktop : sidebar en verre détachée du bord.
- **Illustrations d'univers** : `UniverseArt` dessine une couverture générative (circuit, vinyle, pixels, pellicule…) à partir de l'icône et de la couleur de l'univers.
- **Accessibilité** : `prefers-reduced-transparency` et `prefers-contrast: more` remplacent le verre par des surfaces pleines et masquent les halos.

## Principes

- **Une seule couleur vive par carte** : celle de l'univers sur la carte de parcours, l'accent ailleurs.
- **Quatre tailles de texte** sur mobile ; la hiérarchie vient de la graisse et de la couleur (texte principal ou secondaire).
- **Formes droites** : rayon 22 px pour les cartes, 16 px pour les boutons, bordures de 1 px.
- **Ni italique, ni inclinaison, ni grille de fond, ni effet 3D.**
- **Vert et rouge réservés à la correction**, toujours avec une icône et un mot.
- **Chiffres tabulaires** d'Inter (classe `tabular`), pas de police monospace.

## Couleurs (tokens sémantiques)

Définies dans `src/app/globals.css`, exposées à Tailwind (`bg-surface`, `text-muted`…).

| Token                | Sombre (défaut)   | Clair             | Usage                                                |
| -------------------- | ----------------- | ----------------- | ---------------------------------------------------- |
| `bg`                 | #16142E           | #F6F5FB           | Fond de page                                         |
| `surface`            | #1F1C3E           | #FFFFFF           | Cartes, champs                                       |
| `surface-2`          | #2A2650           | #EFEDF8           | Fonds secondaires, squelettes                        |
| `line`               | #332E5E           | #E3E0F0           | Bordures                                             |
| `ink`                | #F5F4FF           | #1B1838           | Texte principal                                      |
| `muted`              | #A9A4CE           | #5F5A82           | Texte secondaire                                     |
| `accent`             | #FFC83D           | #FFC83D           | Boutons principaux, sélection (fond)                 |
| `on-accent`          | #1A1300           | #1B1838           | Texte sur l'accent                                   |
| `accent-text`        | #FFC83D           | #8A5A00           | Accent utilisé comme couleur de texte (contraste AA) |
| `success` / `danger` | #4ADE80 / #FF6B76 | #15803D / #C8202E | Correction, erreurs                                  |

### Couleurs d'univers

Stockées en base (`universes.color_light`, `color_dark`). `universeStyle()` pose quatre variables CSS et `.universe-scope` choisit la bonne paire selon le thème ; la couleur de texte sur la couleur d'univers est **calculée** pour respecter le contraste WCAG (`readableOn`).

## Typographie

- **Bricolage Grotesque** (`font-display`) pour les titres et les grands chiffres, chargée via `next/font` (choix du labo identité, 28 novembre 2026).
- **Inter Tight** (`font-ui`) pour le logo et les libellés d'interface ; **Inter** pour le texte.
- Les titres d'écran finissent par le **point jaune** de la marque (`TitleDot`, ajouté automatiquement par `PageHeader`, sauf si le titre finit déjà par une ponctuation).

| Classe         | Taille | Usage                             |
| -------------- | ------ | --------------------------------- |
| `text-title`   | 22 px  | Titre d'écran (28 px sur desktop) |
| `text-heading` | 16 px  | Titre de carte ou de section      |
| `text-body`    | 14 px  | Texte courant                     |
| `text-caption` | 12 px  | Légendes, métadonnées             |
| `text-display` | 32 px  | Landing uniquement                |

## Mouvement

Durées `--duration-fast` (120 ms), `--duration-base` (200 ms), `--duration-slow` (360 ms) ; courbe `--ease-out`. Les animations sont neutralisées si l'OS demande moins de mouvement **ou** si l'utilisateur active « Réduire les animations » (`data-motion="reduced"` sur `<html>`).

## Animations

Uniquement CSS et View Transitions natives (aucune bibliothèque) ; tout est neutralisé si l'OS demande moins de mouvement ou si « Réduire les animations » est activé.

| Moment                             | Animation                                                                                                                                                                                                                                                                                                      | Où                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Chargement                         | Logo animé : lettres en vague, point Soleil qui rebondit                                                                                                                                                                                                                                                       | `BrandLoader` (app, onboarding, leçon)                                             |
| Navigation                         | Fondu léger vers le haut à chaque page                                                                                                                                                                                                                                                                         | `src/app/(app)/template.tsx`                                                       |
| Lancement et enchaînement de leçon | Vague Soleil : recouvre l'écran depuis le bouton (700 ms), ondule avec le logo tant que le chargement n'est pas fini, puis s'ouvre depuis le centre (760 ms). « Leçon suivante » recouvre, navigue sous la vague (fallback de route = même écran) et s'ouvre sur la nouvelle leçon. Sautée en mouvement réduit | `WaveTransition`, `WaveHoldScreen` (`src/components/learning/wave-transition.tsx`) |
| Fiches et questions                | Glissement depuis la droite                                                                                                                                                                                                                                                                                    | `.slide-in-x`                                                                      |
| Bonne réponse / erreur             | Rebond + halo vert / secousse                                                                                                                                                                                                                                                                                  | `.anim-pop`, `.anim-shake`                                                         |
| Résultat                           | Rayons, trophée, anneau de précision, compteurs                                                                                                                                                                                                                                                                | `LessonResult`, `CountUp`                                                          |
| Jour / nuit                        | Cercle qui s'ouvre depuis le point cliqué                                                                                                                                                                                                                                                                      | `applyThemePreference` (View Transitions)                                          |

## Thèmes

Clair, sombre, automatique. Préférence enregistrée dans un cookie (appliqué avant le premier rendu) et dans `user_settings` (resynchronisée sur un nouvel appareil par `PreferencesSync`).

## Composants (`src/components/ui`)

| Composant                                                 | Notes                                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                  | `primary`, `secondary`, `ghost`, `danger` ; tailles `sm`, `md` (44 px), `lg` ; `loading` ; `asChild` pour les liens |
| `TextField`, `PasswordField`, `CheckboxField`             | Label, aide, erreur reliés par `aria-describedby` ; `id` explicite si deux champs portent le même `name`            |
| `ChoiceGroup`                                             | Choix unique sur boutons radio natifs (accessible au clavier)                                                       |
| `Switch`                                                  | `role="switch"`                                                                                                     |
| `Card`, `Pill`, `SoonBadge`                               | `SoonBadge` signale une fonctionnalité prévue et sa phase                                                           |
| `Progress`                                                | `role="progressbar"` avec libellé                                                                                   |
| `Avatar`, `Logo`, `Skeleton`, `EmptyState`, `FormMessage` |                                                                                                                     |

## Navigation

- Mobile : barre d'onglets en bas (Accueil, Explorer, Jouer, Ligue, Profil), zones de sécurité respectées.
- Desktop (≥ 1024 px) : sidebar fixe avec les mêmes entrées et Paramètres.

## Sensations : sons, vibrations, effets (28 novembre 2026)

Identité sonore choisie par Tim dans le labo (https://claude.ai/artifact/WE34e3aJednBRTpzmHMZW4) : direction **Premium** (cloches de verre en synthèse FM, clics nets, réverbération légère, sons très courts), avec **défaite, flamme et vague en Doux** (marimba, souffle feutré). Effets en intensité normale.

- Moteur : `src/lib/sensations/` (Web Audio, aucun fichier ; `feedback(id, n)` joue le son et la vibration dans la même frame). Respecte les réglages « Effets sonores » et « Vibrations » (copie par appareil synchronisée depuis le compte) et le mode silencieux de l’iPhone (`audioSession` ambient). Vibrations : Android seulement, l’iPhone ne les autorise pas aux applications web.
- Sons : toucher (à l’appui, via `SensationsRoot`), bonne réponse, combo (la note monte d’un cran par bonne réponse d’affilée), mauvaise réponse, tic-tac des 5 dernières secondes d’un duel, flamme, badge, niveau supérieur, victoire, défaite, vague.
- Effets : éclat doré au point touché pour une bonne réponse, puce « 3 d’affilée » dès le troisième combo, confettis (victoire en duel, niveau supérieur), intro VS puis 3-2-1 avant la première question d’un duel (le chrono serveur démarre après), battement du chrono sur la fin.
- Interface : appui élastique (écrasement à 0,96 à l’appui, retour avec léger dépassement) sur les boutons et réponses ; pastille de la barre du bas qui glisse avec un ressort, icône qui rebondit ; boutons icônes portés à 44 px ; libellés de la barre à 12 px.
- Tout effet visuel est coupé en mouvement réduit (OS ou réglage) ; les sons restent pilotés par leur propre réglage.

## Identité : voix et titres (28 novembre 2026)

Choix de Tim dans le labo identité (artifact) : titres en Bricolage Grotesque avec le point jaune, boutons Verre conservés, voix plus directe avec de l'humour. Une mascotte (« le Point ») et des illustrations figuratives d'univers ont été essayées puis retirées le même jour : trop enfantines pour la cible. Les bannières d'univers (`UniverseArt`) restent abstraites ; pas de personnage dans l'interface.

- **Voix** : `src/config/voice.ts` centralise les phrases à personnalité (réponses variées par question via `AnswerHeading`, titres de résultat, duel « Clutch ! » quand l'écart est inférieur à 60 points, « Pole position ! » en tête de ligue, bilans de division). Ton direct, proche, tutoiement, une touche d'humour, jamais culpabilisant.
