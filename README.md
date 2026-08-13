# Les écrans à l'échelle

Comparaison d'écrans de smartphones, de pliables et de tablettes **à l'échelle réelle relative** :
chaque rectangle est la zone d'affichage active, calculée à partir de la diagonale officielle et de
la résolution, dessinée sur une grille millimétrique commune. Un curseur de calibration permet de
passer en 1:1 en posant une carte bancaire sur l'écran.

Aucun texte de l'interface n'énonce combien d'appareils contient le catalogue : ni le titre, ni la
description, ni l'accroche, ni les verdicts. C'est délibéré — un ajout d'appareil ne doit demander
aucune retouche de la prose. Les comptes qui décrivent la *sélection courante* restent, eux, puisque
grandir le catalogue ne les rend pas faux.

Interface disponible en **français** et en **anglais** — `/fr` et `/en`, la racine redirige selon la
langue du navigateur.

## Le catalogue

| Appareil | Type | Dalles |
| --- | --- | --- |
| Pixel 7 Pro | barre | 6,7″ — référence de tous les pourcentages |
| Pixel 11 Pro | barre | 6,3″ |
| Pixel 11 Pro XL | barre | 6,8″ |
| Pixel 11 Pro Fold | pliable book | 6,5″ externe · 8″ interne |
| Galaxy Z Fold8 | pliable large | 5,5″ externe · 7,6″ interne (4:3 paysage) |
| Galaxy Z Fold8 Ultra | pliable book | 6,5″ externe · 8″ interne |
| Galaxy Tab S10+ | tablette | 12,4″ en 16:10 — l'échelle haute du relevé |

Uniquement des données officielles : aucune estimation de rumeur.

La Tab S10+ n'est pas un concurrent des six téléphones, elle sert d'étalon : sa dalle fait 446,1 cm²,
soit +116 % sur le plus grand pliable déplié. Elle est saisie **en paysage**, l'orientation dans
laquelle Samsung la spécifie (185,4 × 285,4 mm) — en portrait elle dépasserait la hauteur de la scène.
Comme la longueur des barres de la section 02 est normée sur la plus grande dalle du catalogue, c'est
désormais la sienne qui fixe le 100 %.

## Ajouter un appareil

Le catalogue est externalisé — un fichier JSON par téléphone dans `data/appareils/`. Pour en ajouter
un, copiez le fichier le plus proche, renommez-le d'après son `id`, et remplissez ses spécifications
publiées. Rien d'autre : les puces de sélection, la scène, les barres de surface, les mises en
situation et le tableau se déduisent tous du catalogue.

```jsonc
{
  "id": "monphone",          // doit reprendre le nom du fichier
  "order": 70,               // rang d'affichage
  "name": "Mon Phone",
  "kind": "bar",             // "bar" ou "fold"
  "hue": { "light": "#…", "dark": "#…" },
  "role": { "fr": "…", "en": "…" },   // toute chaîne visible porte ses deux langues
  "body": { "closed": { "w": 0, "h": 0, "d": 0, "r": 0 } },
  "screens": { "main": { "diag": 0, "px": [0, 0], "…": "…" } },
  "sources": [{ "who": "…", "what": { "fr": "…", "en": "…" }, "url": "https://…" }]
}
```

Seules la diagonale et la résolution sont saisies : largeur et hauteur en mm, surface en cm², dp et
densité recalculée sont **déduites**. `pnpm build` valide le fichier et nomme le champ fautif.

`data/reglages.json` fixe l'appareil de référence **de départ**, la sélection de départ et les bornes
de l'échelle. La section 02 laisse ensuite prendre n'importe quelle dalle en scène comme repère des
100 % : rien n'oblige à toujours comparer au même appareil. Barres, tableau, fiche, mises en situation
et verdicts suivent le choix ; les textes qui parlent du Pixel 7 Pro *lui-même* continuent, eux, de se
calculer contre lui.

## Développement

```bash
pnpm install
pnpm dev                      # http://localhost:3000
pnpm check                    # types + construction (la construction valide le catalogue)
bash scripts/fumee.sh         # test de fumee sur la construction
```

**Node 24 minimum** (`.nvmrc`) — la construction refuse de démarrer en deçà. Next.js 16 · React 19 ·
TypeScript. La seule dépendance hors framework est `@vercel/analytics`, sans cookie ni identifiant
persistant, et inerte tant que le site n'est pas déployé. La cible navigateur est déclarée dans
`browserslist` : navigateurs récents uniquement.

## Structure

```
app/[locale]/     enveloppe de page, métadonnées, jetons de couleur générés
components/       Comparateur (état) + une section par fichier
lib/              catalogue (chargement + validation), géométrie, disposition, formats
i18n/             contrat de traduction, fr, en
data/             appareils/*.json et reglages.json
proxy.ts          négociation de langue à la racine
```

Voir `CLAUDE.md` pour l'architecture détaillée : système de coordonnées en millimètres, dérivations,
et contrat d'internationalisation.

## Intégration continue et versions

La CI vérifie chaque branche : types, construction — qui valide aussi le catalogue — puis un test de
fumée qui démarre le serveur et contrôle que la racine négocie la langue, que les deux langues sont
servies et que les nombres suivent leur séparateur décimal.

Une version se publie en posant une étiquette `vX.Y.Z`. Le workflow refuse de publier si l'étiquette
et la `version` de `package.json` divergent, puis crée la publication GitHub avec ses notes et une
archive `instantane-vX.Y.Z.tar.gz` : les deux langues prérendues et leurs actifs, interactives derrière
n'importe quel serveur de fichiers. C'est une archive du relevé, pas le déployable.

## Déploiement

Site statique sur Vercel, déployé depuis git : les deux langues sont prérendues à la construction.
