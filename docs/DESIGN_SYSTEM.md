# Design system — direction 2

Construite à partir des retours sur les trois pistes de la phase 0 : le fond nuit et le caractère de la direction « Collection », la logique de couleur de « Pochette », la barre d'onglets de « Télémétrie », et une typographie simple.

## Principes

- **Une seule couleur vive par carte** : celle de l'univers sur la carte de parcours, l'accent ailleurs.
- **Quatre tailles de texte** sur mobile ; la hiérarchie vient de la graisse et de la couleur (texte principal ou secondaire).
- **Formes droites** : rayon 14 px pour les cartes, 10 px pour les champs et boutons, bordures de 1 px.
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

- **Inter Tight** (500-700) pour les titres, chargée via `next/font`.
- **Inter** pour le texte.

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

| Moment                 | Animation                                                                             | Où                                        |
| ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| Chargement             | Logo animé : lettres en vague, point Soleil qui rebondit                              | `BrandLoader` (app, onboarding, leçon)    |
| Navigation             | Fondu léger vers le haut à chaque page                                                | `src/app/(app)/template.tsx`              |
| Lancement de leçon     | Écran « C'est parti ! » avec ondes, ~0,9 s (masque aussi le chargement de la session) | `LaunchScreen`                            |
| Fiches et questions    | Glissement depuis la droite                                                           | `.slide-in-x`                             |
| Bonne réponse / erreur | Rebond + halo vert / secousse                                                         | `.anim-pop`, `.anim-shake`                |
| Résultat               | Rayons, trophée, anneau de précision, compteurs                                       | `LessonResult`, `CountUp`                 |
| Jour / nuit            | Cercle qui s'ouvre depuis le point cliqué                                             | `applyThemePreference` (View Transitions) |

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
