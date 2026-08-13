# Six écrans à l'échelle

Comparaison des écrans de six smartphones **à l'échelle réelle relative** : chaque rectangle est la
zone d'affichage active, calculée à partir de la diagonale officielle et de la résolution, dessinée
sur une grille millimétrique commune. Un curseur de calibration permet de passer en 1:1 en posant une
carte bancaire sur l'écran.

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

Neuf dalles, uniquement des données officielles : aucune estimation de rumeur.

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

`data/reglages.json` fixe l'appareil de référence, la sélection de départ et les bornes de l'échelle.

## Développement

```bash
pnpm install
pnpm dev                      # http://localhost:3000
pnpm check                    # types + construction (la construction valide le catalogue)
bash scripts/fumee.sh         # test de fumee sur la construction
```

Next.js 16 · React 19 · TypeScript · aucune dépendance d'exécution hors framework. La cible navigateur
est déclarée dans `browserslist` : navigateurs récents uniquement.

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
