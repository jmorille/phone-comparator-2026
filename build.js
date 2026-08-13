// Construit le site statique publie sur Vercel, dans dist/.
//
// ecrans-echelle.html est un *corps* d'artefact Claude : il commence a <title> et
// n'a ni <!doctype>, ni <html>, ni <head>, ni <body> -- c'est deliberatement ainsi
// (voir CLAUDE.md), l'enveloppe etant ajoutee au moment de la publication. Ouvert
// tel quel dans un navigateur, il bascule en Quirks Mode et ne rend pas comme la
// version publiee. Ce script lui ajoute donc cette enveloppe et ecrit
// dist/index.html, sans jamais toucher au fichier source.

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "ecrans-echelle.html");
const OUT_DIR = path.join(__dirname, "dist");
const OUT = path.join(OUT_DIR, "index.html");

const fail = msg => { console.error("ECHEC : " + msg); process.exit(1); };

if (!fs.existsSync(SRC)) fail("ecrans-echelle.html est introuvable.");

// Garde-fou : le depot maintient le fichier en ASCII pur (voir asciify.js). Si
// l'invariant est rompu, la construction s'arrete plutot que de publier un
// encodage douteux.
const raw = fs.readFileSync(SRC);
const nonAscii = raw.reduce((n, c) => n + (c > 127 ? 1 : 0), 0);
if (nonAscii) fail(`${nonAscii} octet(s) non-ASCII dans ecrans-echelle.html. Lancez "node asciify.js".`);

const body = raw.toString("latin1");

const titleMatch = body.match(/<title>([\s\S]*?)<\/title>/);
if (!titleMatch) fail("pas de <title> dans ecrans-echelle.html.");
const title = titleMatch[1].trim();

// Le corps doit deja etre un corps : s'il contient une enveloppe, quelqu'un s'est
// trompe de fichier ou a "repare" la source.
if (/<!doctype|<html[\s>]|<body[\s>]/i.test(body)) {
  fail("ecrans-echelle.html contient deja une enveloppe HTML : il doit rester un corps d'artefact.");
}

const DESC = "Les ecrans de six smartphones dessines a l'echelle reelle relative : "
           + "Pixel 7 Pro, Pixel 11 Pro, Pixel 11 Pro XL, Pixel 11 Pro Fold, "
           + "Galaxy Z Fold8 et Z Fold8 Ultra. Neuf dalles, mesurees sur la meme grille.";

const ICON = "data:image/svg+xml,"
  + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
  + "%3Crect width='32' height='32' rx='7' fill='%230D1017'/%3E"
  + "%3Crect x='6' y='5' width='9' height='22' rx='2.5' fill='none' stroke='%23E0A94A' stroke-width='1.8'/%3E"
  + "%3Crect x='17' y='9' width='9' height='18' rx='2' fill='none' stroke='%236FA8FF' stroke-width='1.8'/%3E"
  + "%3C/svg%3E";

const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${DESC}">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${DESC}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${ICON}">
<style>*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0}</style>
</head>
<body>
${body}
</body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, page, "latin1");

console.log(`OK - dist/index.html ecrit (${fs.statSync(OUT).size} octets) - "${title}"`);
