import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { avecGeometrie } from "./geometrie";
import {
  LOCALES,
  panneauxDe,
  type Appareil,
  type Catalogue,
  type Chassis,
  type Ecran,
  type EcranBrut,
  type Panneau,
  type Reglages,
  type Source,
  type Traduit,
} from "./types";

const RACINE = process.cwd();
const DOSSIER_APPAREILS = join(RACINE, "data", "appareils");
const FICHIER_REGLAGES = join(RACINE, "data", "reglages.json");

/* -- validation ------------------------------------------------------ */
// Le catalogue est la surface d'extension du projet : c'est le seul endroit ou
// quelqu'un ecrira des donnees a la main. Une erreur de saisie doit donc casser
// la construction avec un message qui nomme le fichier et le champ, pas produire
// un NaN qui se propage silencieusement jusqu'a une cote affichee.

class ErreurCatalogue extends Error {
  constructor(fichier: string, message: string) {
    super(`data/appareils/${fichier} : ${message}`);
    this.name = "ErreurCatalogue";
  }
}

const estObjet = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function champ(o: Record<string, unknown>, cle: string, fichier: string, ou: string): unknown {
  if (!(cle in o)) throw new ErreurCatalogue(fichier, `champ « ${cle} » manquant dans ${ou}`);
  return o[cle];
}

function nombre(o: Record<string, unknown>, cle: string, fichier: string, ou: string): number {
  const v = champ(o, cle, fichier, ou);
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new ErreurCatalogue(fichier, `« ${cle} » doit être un nombre fini dans ${ou} (reçu ${JSON.stringify(v)})`);
  return v;
}

function texte(o: Record<string, unknown>, cle: string, fichier: string, ou: string): string {
  const v = champ(o, cle, fichier, ou);
  if (typeof v !== "string" || !v.trim())
    throw new ErreurCatalogue(fichier, `« ${cle} » doit être une chaîne non vide dans ${ou}`);
  return v;
}

/** Une chaîne traduite doit porter toutes les langues : pas de repli silencieux. */
function traduit(o: Record<string, unknown>, cle: string, fichier: string, ou: string): Traduit {
  const v = champ(o, cle, fichier, ou);
  if (!estObjet(v))
    throw new ErreurCatalogue(fichier, `« ${cle} » doit être un objet { ${LOCALES.join(", ")} } dans ${ou}`);
  const sortie = {} as Traduit;
  for (const l of LOCALES) {
    const t = v[l];
    if (typeof t !== "string" || !t.trim())
      throw new ErreurCatalogue(fichier, `« ${cle}.${l} » manquant ou vide dans ${ou}`);
    sortie[l] = t;
  }
  return sortie;
}

function chassis(v: unknown, fichier: string, ou: string): Chassis {
  if (!estObjet(v)) throw new ErreurCatalogue(fichier, `${ou} doit être un objet { w, h, d, r }`);
  return {
    w: nombre(v, "w", fichier, ou),
    h: nombre(v, "h", fichier, ou),
    d: nombre(v, "d", fichier, ou),
    r: nombre(v, "r", fichier, ou),
  };
}

function ecran(v: unknown, fichier: string, ou: string): Ecran {
  if (!estObjet(v)) throw new ErreurCatalogue(fichier, `${ou} doit être un objet`);
  const px = champ(v, "px", fichier, ou);
  if (!Array.isArray(px) || px.length !== 2 || px.some((n) => typeof n !== "number" || n <= 0))
    throw new ErreurCatalogue(fichier, `« px » doit être [largeur, hauteur] en pixels dans ${ou}`);
  const hdr = champ(v, "hdr", fichier, ou);
  if (hdr !== null && (typeof hdr !== "number" || !Number.isFinite(hdr)))
    throw new ErreurCatalogue(fichier, `« hdr » doit être un nombre ou null dans ${ou}`);

  const brut: EcranBrut = {
    label: traduit(v, "label", fichier, ou),
    diag: nombre(v, "diag", fichier, ou),
    px: [px[0] as number, px[1] as number],
    ppi: nombre(v, "ppi", fichier, ou),
    ratio: traduit(v, "ratio", fichier, ou),
    tech: traduit(v, "tech", fichier, ou),
    hz: traduit(v, "hz", fichier, ou),
    peak: nombre(v, "peak", fichier, ou),
    hdr: hdr as number | null,
    glass: traduit(v, "glass", fichier, ou),
    r: nombre(v, "r", fichier, ou),
  };
  if (brut.diag <= 0) throw new ErreurCatalogue(fichier, `« diag » doit être positive dans ${ou}`);
  return avecGeometrie(brut);
}

function sources(v: unknown, fichier: string): Source[] {
  if (!Array.isArray(v))
    throw new ErreurCatalogue(fichier, "« sources » doit être un tableau (au moins une source officielle)");
  return v.map((s, i) => {
    const ou = `sources[${i}]`;
    if (!estObjet(s)) throw new ErreurCatalogue(fichier, `${ou} doit être un objet`);
    const url = texte(s, "url", fichier, ou);
    if (!/^https?:\/\//.test(url)) throw new ErreurCatalogue(fichier, `${ou}.url doit être une URL http(s)`);
    return { who: texte(s, "who", fichier, ou), what: traduit(s, "what", fichier, ou), url };
  });
}

function validerAppareil(v: unknown, fichier: string): Appareil {
  if (!estObjet(v)) throw new ErreurCatalogue(fichier, "le fichier doit contenir un objet JSON");

  const kind = texte(v, "kind", fichier, "l'appareil");
  if (kind !== "bar" && kind !== "fold")
    throw new ErreurCatalogue(fichier, `« kind » doit valoir "bar" ou "fold" (reçu "${kind}")`);

  const hue = champ(v, "hue", fichier, "l'appareil");
  if (!estObjet(hue)) throw new ErreurCatalogue(fichier, "« hue » doit être un objet { light, dark }");

  const base = {
    id: texte(v, "id", fichier, "l'appareil"),
    order: nombre(v, "order", fichier, "l'appareil"),
    name: texte(v, "name", fichier, "l'appareil"),
    ref: texte(v, "ref", fichier, "l'appareil"),
    brand: texte(v, "brand", fichier, "l'appareil"),
    weight: nombre(v, "weight", fichier, "l'appareil"),
    hue: {
      light: texte(hue, "light", fichier, "hue"),
      dark: texte(hue, "dark", fichier, "hue"),
    },
    role: traduit(v, "role", fichier, "l'appareil"),
    announced: traduit(v, "announced", fichier, "l'appareil"),
    sources: sources(champ(v, "sources", fichier, "l'appareil"), fichier),
  };

  if (base.id !== fichier.replace(/\.json$/, ""))
    throw new ErreurCatalogue(fichier, `« id » vaut "${base.id}" : il doit reprendre le nom du fichier`);

  const body = champ(v, "body", fichier, "l'appareil");
  const screens = champ(v, "screens", fichier, "l'appareil");
  if (!estObjet(body) || !estObjet(screens))
    throw new ErreurCatalogue(fichier, "« body » et « screens » doivent être des objets");

  if (kind === "bar") {
    return {
      ...base,
      kind,
      body: { closed: chassis(champ(body, "closed", fichier, "body"), fichier, "body.closed") },
      screens: { main: ecran(champ(screens, "main", fichier, "screens"), fichier, "screens.main") },
    };
  }
  return {
    ...base,
    kind,
    body: {
      closed: chassis(champ(body, "closed", fichier, "body"), fichier, "body.closed"),
      open: chassis(champ(body, "open", fichier, "body"), fichier, "body.open"),
    },
    screens: {
      cover: ecran(champ(screens, "cover", fichier, "screens"), fichier, "screens.cover"),
      inner: ecran(champ(screens, "inner", fichier, "screens"), fichier, "screens.inner"),
    },
  };
}

/* -- chargement ------------------------------------------------------ */

let cache: Catalogue | null = null;

export function chargerCatalogue(): Catalogue {
  if (cache) return cache;

  const fichiers = readdirSync(DOSSIER_APPAREILS)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (!fichiers.length) throw new Error("data/appareils/ ne contient aucun fichier JSON.");

  const appareils = fichiers
    .map((f) => validerAppareil(JSON.parse(readFileSync(join(DOSSIER_APPAREILS, f), "utf8")), f))
    .sort((a, b) => a.order - b.order);

  const doublon = appareils.find((d, i) => appareils.findIndex((x) => x.order === d.order) !== i);
  if (doublon) throw new Error(`Deux appareils partagent « order »: ${doublon.order} (${doublon.id}).`);

  const parId = Object.fromEntries(appareils.map((d) => [d.id, d])) as Record<string, Appareil>;
  const reglages = JSON.parse(readFileSync(FICHIER_REGLAGES, "utf8")) as Reglages;

  const refApp = parId[reglages.reference];
  if (!refApp)
    throw new Error(
      `data/reglages.json : « reference » vaut "${reglages.reference}", absent du catalogue.`,
    );
  if (refApp.kind !== "bar")
    throw new Error(
      `data/reglages.json : la référence doit être une barre (« ${refApp.id} » est un pliable).`,
    );

  for (const id of reglages.selectionParDefaut) {
    if (!parId[id])
      throw new Error(`data/reglages.json : « selectionParDefaut » cite "${id}", absent du catalogue.`);
  }
  if (!parId[reglages.ficheParDefaut])
    throw new Error(
      `data/reglages.json : « ficheParDefaut » vaut "${reglages.ficheParDefaut}", absent du catalogue.`,
    );

  const tousPanneaux: Panneau[] = appareils.flatMap(panneauxDe);

  cache = {
    appareils,
    parId,
    ref: refApp.screens.main,
    refId: refApp.id,
    tousPanneaux,
    maxArea: Math.max(...tousPanneaux.map((p) => p.s.area)),
    reglages,
  };
  return cache;
}
