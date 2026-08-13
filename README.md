# Six écrans à l'échelle

Une page unique, autonome et sans dépendance, qui compare les écrans de six smartphones
**dessinés à l'échelle réelle relative** — on ne lit pas des chiffres dans un tableau, on
voit les rectangles se superposer sur la même grille millimétrique.

| Appareil | Dalle(s) |
|---|---|
| Google Pixel 7 Pro | 6,7″ — le mètre-étalon non pliable |
| Google Pixel 11 Pro | 6,3″ |
| Google Pixel 11 Pro XL | 6,8″ |
| Google Pixel 11 Pro Fold | 6,5″ externe · 8″ interne |
| Samsung Galaxy Z Fold8 | 5,5″ externe · 7,6″ interne (plie en largeur) |
| Samsung Galaxy Z Fold8 Ultra | 6,5″ externe · 8″ interne |

Neuf dalles au total. Toutes les fiches techniques sont **officielles** ; les cotes en
millimètres, les surfaces en cm², les densités recalculées et les écarts en pourcentage
sont **déduits** de la diagonale et de la résolution, jamais saisis en dur.

## Développement

Aucune dépendance, aucun gestionnaire de paquets à installer.

```bash
npm run build     # écrit dist/index.html
npm run asciify   # normalise l'encodage de la source (obligatoire après édition)
npm run check     # les deux à la suite
```

Puis ouvrez `dist/index.html`.

**N'ouvrez jamais `ecrans-echelle.html` directement dans un navigateur.** C'est un *corps*
de page, sans `<!doctype html>` : le navigateur bascule en Quirks Mode et le rendu ne
correspond pas au site publié. `build.js` lui ajoute l'enveloppe attendue et écrit
`dist/index.html` — c'est ce fichier-là qu'il faut regarder.

La source est maintenue en **ASCII pur** pour que son encodage ne puisse jamais être mal
interprété : les accents y vivent sous forme d'entités `&#xE9;` dans le balisage et
d'échappements `\uXXXX` dans le script. `asciify.js` applique et vérifie cette règle, et
`build.js` refuse de construire si elle est rompue.

## Déploiement

Site statique sur Vercel : `node build.js` produit `dist/`, servi tel quel. Rien d'autre
à configurer, voir `vercel.json`.

## Structure

| Fichier | Rôle |
|---|---|
| `ecrans-echelle.html` | toute la page — un `<style>`, un `<script>`, zéro dépendance |
| `build.js` | enveloppe la source et écrit `dist/index.html` |
| `asciify.js` | garantit l'invariant ASCII |
| `CLAUDE.md` | notes d'architecture et conventions |
| `prompt.md` | le brief d'origine — archive, pas spécification |

## Sources

Les caractéristiques proviennent des fiches constructeur (Google Store, Samsung), de
GSMArena et de Wikipédia ; la liste complète est en bas de page, section « Méthode et
sources ». Aucune donnée de rumeur n'entre dans la comparaison.
