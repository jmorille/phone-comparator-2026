// Assemble un instantane statique et autonome de la construction, dans instantane/.
//
// Les deux langues sont prerendues par `next build` ; il suffit donc de reunir
// leurs pages et les actifs de .next/static sous le prefixe /_next/static que
// referencent ces pages. Le resultat s'ouvre derriere n'importe quel serveur de
// fichiers, se conserve hors de Vercel, et reste pleinement interactif :
// l'hydratation React se fait depuis ces memes actifs.
//
// Ce n'est pas le deployable -- la redirection de racine par langue est assuree
// en production par proxy.ts, remplacee ici par une page de redirection. C'est
// une archive : le releve tel qu'il etait a la date de la version.

import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const RACINE = process.cwd();
const PAGES = join(RACINE, ".next", "server", "app");
const ACTIFS = join(RACINE, ".next", "static");
const SORTIE = join(RACINE, "instantane");
const LANGUE_DEFAUT = process.env.LANGUE_DEFAUT ?? "fr";

const echec = (m) => {
  console.error("ECHEC : " + m);
  process.exit(1);
};

if (!existsSync(PAGES) || !existsSync(ACTIFS))
  echec("construction introuvable. Lancez « pnpm build » d'abord.");

// les pages internes de Next commencent par un souligne (_not-found, _global-error)
const langues = (await readdir(PAGES))
  .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
  .map((f) => f.replace(/\.html$/, ""))
  .sort();

if (!langues.length) echec("aucune page prerendue dans .next/server/app.");

await rm(SORTIE, { recursive: true, force: true });
await mkdir(join(SORTIE, "_next"), { recursive: true });
await cp(ACTIFS, join(SORTIE, "_next", "static"), { recursive: true });

for (const langue of langues) {
  await cp(join(PAGES, `${langue}.html`), join(SORTIE, `${langue}.html`));
}

// La negociation de langue vit dans proxy.ts, qui ne tourne pas derriere un
// simple serveur de fichiers : on la remplace par une redirection explicite.
const defaut = langues.includes(LANGUE_DEFAUT) ? LANGUE_DEFAUT : langues[0];
await writeFile(
  join(SORTIE, "index.html"),
  `<!doctype html>
<html lang="${defaut}">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=./${defaut}.html">
<link rel="canonical" href="./${defaut}.html">
<title>Six ecrans a l'echelle</title>
</head>
<body><p>${langues.map((l) => `<a href="./${l}.html">${l}</a>`).join(" &middot; ")}</p></body>
</html>
`,
  "utf8",
);

console.log(`OK - instantane/ assemble : ${langues.join(", ")} (defaut ${defaut})`);
