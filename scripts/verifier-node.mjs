// Refuse de construire sous une version de Node anterieure a celle exigee.
//
// « engines » dans package.json n'est qu'une indication : npm l'ignore sans
// --engine-strict, et pnpm 11 ne lit plus ce reglage depuis .npmrc. Ce controle
// explicite est donc le seul qui morde vraiment, et il mord la ou il compte --
// avant la construction, y compris sur Vercel, qui lance « pnpm build ».
//
// La comparaison porte sur le numero majeur, ce qui suffit pour une exigence de
// la forme « >=NN ».

import { readFileSync } from "node:fs";

const paquet = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const exigence = paquet.engines?.node;

if (!exigence) {
  console.error('ECHEC : package.json ne declare pas "engines.node".');
  process.exit(1);
}

const majeurExige = Number(exigence.match(/(\d+)/)?.[1]);
const majeurCourant = Number(process.versions.node.split(".")[0]);

if (!Number.isFinite(majeurExige)) {
  console.error(`ECHEC : "engines.node" vaut "${exigence}", dont aucun numero majeur ne se deduit.`);
  process.exit(1);
}

if (majeurCourant < majeurExige) {
  console.error(
    `ECHEC : Node ${process.versions.node} est en deca de l'exigence "${exigence}".\n` +
      `        Ce projet cible Node ${majeurExige} au minimum (voir .nvmrc).`,
  );
  process.exit(1);
}

console.log(`OK - Node ${process.versions.node} satisfait "${exigence}"`);
