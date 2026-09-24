# PacePro — Charte de design "épuré & moderne" (refonte radicale)

Objectif : garder l'identité PacePro (rouge #FF0040, thème sombre, Syne + DM Mono, logo)
mais retirer tout le bruit visuel "sci-fi/terminal" accumulé et donner une hiérarchie
claire, aérée, cohérente — dans l'esprit d'apps comme Whoop / Linear / Strava (2024+).

Ceci est un refactor **visuel uniquement**. Ne touche jamais à :
- la logique métier, les handlers, le state, les calculs, les appels Supabase/API
- les noms de props, de fonctions, de routes/tabs
- le comportement fonctionnel d'un composant

Uniquement les `style={{...}}`, les classNames, et le JSX purement décoratif
(divs de glow/scan-line qui n'affichent aucune donnée) peuvent être modifiés ou supprimés.

## 1. Ce qu'on supprime partout (le plus gros gain visuel)

- **Scan-line sweeps** : tout `<div>` avec `animation:'scanLine ...'` ou
  `background:'linear-gradient(90deg, transparent, rgba(...), transparent)'` utilisé comme
  effet décoratif qui traverse une carte. À supprimer entièrement.
- **Blobs radiaux ambiants** : tout `<div>` `position:'absolute'` avec
  `background:'radial-gradient(circle, rgba(...) 0%, transparent 70%)'` posé en fond de carte/écran
  pour faire un halo. À supprimer, SAUF un unique halo très discret possible sur l'écran d'accueil
  (Home) derrière le hero, jamais ailleurs.
- **Faux headers "terminal"** : la rangée avec 3 petits ronds (style feux macOS) +
  un label du genre `TRAINING.SYSTEM · INIT` / `HEALTH.AI · BILAN SANTÉ` en DM Mono majuscules.
  À supprimer en entier (toute la rangée), le titre de la carte suffit.
- **`borderGlow` / `glow-pulse` / halos animés en boucle infinie** sur des cartes statiques :
  à supprimer. Garder les micro-interactions au clic/hover (`btn-ripple`, `card-hover`), pas les
  animations perpétuelles.
- **Rainbow soup** : un module qui utilise 4-5 couleurs d'accent différentes sur une même vue
  (rouge + ambre + indigo + cyan + vert en simultané sur des cartes de taille égale) doit être
  réduit : une seule couleur d'accent domine par écran (en général --accent rouge), les autres
  couleurs ne servent plus que pour de petites pastilles d'icône (36-40px) ou badges d'état, jamais
  pour un fond de carte entier en dégradé.

## 2. Ce qu'on garde / renforce

- Fond très sombre quasi-noir (`--bg-primary`), cartes légèrement plus claires (`--bg-card`),
  bordures fines à faible opacité. C'est un bon socle "moderne dark" — on ne repart pas sur un fond
  clair.
- Syne pour les titres/labels de boutons (display, gras, tracking négatif sur les grandes tailles).
- DM Mono réservé aux vraies données chiffrées (chronos, séries, kcal, distances, dates courtes) et
  à UN SEUL label "eyebrow" par section maximum — pas sur chaque ligne de texte.
- Le rouge `--accent` (#FF0040) reste la seule couleur de call-to-action primaire et de highlight.
- Les micro-animations d'entrée (`fadeSlideUp`, `scaleIn`, `tab-enter`, `modal-enter`) et le
  feedback au clic (`btn-ripple`, scale au press) restent — elles donnent du "polish" sans bruit.

## 3. Tokens (déjà posés dans `app/globals.css` / `ThemeStyles`, ne pas renommer)

Variables CSS existantes à réutiliser telles quelles (leurs valeurs ont été affinées, mais les noms
n'ont pas changé) : `--bg-primary --bg-card --bg-surface --bg-input --bg-nav --bg-modal
--text-primary --text-secondary --text-muted --text-ultra-muted --border --border-input --border-nav
--btn-ghost-bg --btn-ghost-border --btn-ghost-color --chip-bg --chip-border --progress-track
--svg-text --svg-text-val`.

Nouvelles variables/classes utilitaires ajoutées dans `globals.css` (à utiliser quand c'est pratique,
mais garder aussi les styles inline existants est OK — l'important est le résultat visuel, pas la
méthode) :

- `--accent` = #FF0040, `--accent-soft` = rgba(255,0,64,0.12) — pour fond de pastille/icône.
- `--radius-sm` 10px, `--radius-md` 14px, `--radius-lg` 18px, `--radius-xl` 24px, `--radius-pill` 999px.
  → Arrondir les `borderRadius` inline existants à la valeur la plus proche de cette échelle
  (au lieu du mélange actuel 8/10/12/14/16/18/20/22/24/28).
- `--space-1..8` = 4/8/12/16/20/24/32/40px → même logique, arrondir les paddings/gaps à ces valeurs.
- `.card` = fond `var(--bg-card)`, `border:1px solid var(--border)`, `border-radius:var(--radius-lg)`,
  `padding:18px` (utiliser si tu réécris une carte de zéro ; sinon garder l'objet `card` déjà défini
  localement dans chaque fichier et juste corriger ses valeurs).
- `.icon-tile` = 38×38px, `border-radius:var(--radius-sm)`, fond `color-mix` ou rgba à 12% de la
  couleur contextuelle, icône centrée à 18-20px.
- `.eyebrow` = DM Mono, 10-11px, 600-700, `letter-spacing:0.06em` (pas 0.15em), `text-transform:uppercase`,
  couleur `var(--text-muted)`.

## 4. Échelle typographique cible

| Usage                        | Police    | Taille | Poids   | Letter-spacing |
|-------------------------------|-----------|--------|---------|-----------------|
| Titre d'écran (hero)          | Syne      | 26-30px| 800-900 | -0.03em         |
| Titre de section (H2)         | Syne      | 17-19px| 800     | -0.02em         |
| Titre de carte (H3)           | Syne      | 14-15px| 700-800 | -0.01em         |
| Corps / description           | Syne      | 12-13px| 400-500 | normal          |
| Eyebrow / label section       | DM Mono   | 10-11px| 600-700 | 0.06em, upper   |
| Donnée chiffrée (stat, kpi)   | DM Mono   | 11-22px| 500-800 | normal          |

## 5. Boutons

- **Primaire** : fond `var(--accent)` plein (pas de dégradé multi-stop compliqué — un simple
  `linear-gradient(135deg, #FF0040, #d40036)` reste OK si déjà présent, sinon couleur plate),
  texte blanc, `border-radius:var(--radius-md)`, pas de bordure, ombre légère seulement au hover/press
  (via `.btn-ripple`/`.card-hover`, pas d'ombre statique lourde).
- **Secondaire / ghost** : fond `var(--btn-ghost-bg)`, bordure `1px solid var(--btn-ghost-border)`,
  texte `var(--text-primary)` ou `var(--btn-ghost-color)`.
- Ne pas créer de 3e, 4e couleur de bouton (bleu, ambre...) pour des actions secondaires — utiliser
  le ghost.

## 6. Cartes / pastilles d'icône

- Une carte = fond neutre (`--bg-card`), bordure fine neutre. La couleur contextuelle (rouge muscu,
  bleu nutrition, vert historique, etc. — garde les couleurs déjà utilisées comme identifiants de
  catégorie) n'apparaît que dans la pastille d'icône (38×38px, radius 10-12, fond à 10-12% d'opacité)
  et éventuellement un petit badge de statut (pastille 6-8px), jamais en dégradé de fond sur toute la
  carte ni en bordure colorée pleine largeur.

## 7. Espacement des écrans

- Padding externe d'écran : 16-20px (garder `calc(env(safe-area-inset-top, 44px) + 16px)` etc. tel
  quel, c'est fonctionnel).
- Entre sections : 24-32px. Entre cartes d'une même grille : 10-12px.
- Réduire le nombre de sections avec un header dédié à répétition ; regrouper visuellement plutôt que
  multiplier les petites cartes avec chacune leur propre en-tête.

## 8. Process attendu de chaque agent

1. Lire ce fichier en entier avant de toucher au code.
2. Ouvrir le/les fichier(s) qui te sont assignés, identifier chaque bloc décrit en §1 et le
   supprimer/simplifier.
3. Repasser sur les couleurs/radius/spacing pour les rapprocher de l'échelle §3/§4/§7, sans tout
   réécrire ligne à ligne si ce n'est pas nécessaire — priorité au résultat visuel, pas à la pureté du
   diff.
4. Ne rien casser fonctionnellement : mêmes onClick, mêmes states, mêmes données affichées.
5. Une fois terminé, lancer `npx next build` (ou au moins vérifier qu'il n'y a pas d'erreur de syntaxe
   JSX évidente si le build n'est pas possible dans ton environnement) et corriger toute erreur avant
   de rendre la main.
6. Committer tes changements avec un message clair (`git add -A && git commit -m "design: ..."`).
