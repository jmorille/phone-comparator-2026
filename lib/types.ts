// Contrat du catalogue. Les fichiers data/appareils/*.json sont valides contre ces
// types au chargement (voir lib/catalogue.ts) : un champ manquant ou un `kind`
// inconnu arrete la construction, il n'atteint jamais l'ecran.

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Chaine traduite. Toute chaine visible du catalogue passe par la. */
export type Traduit = Record<Locale, string>;

export type Kind = "bar" | "fold";
/** Etat du pli. Une barre est toujours consideree "closed". */
export type EtatPli = "open" | "closed";
export type CleEcran = "main" | "cover" | "inner";

export interface Chassis {
  /** largeur en mm */
  w: number;
  /** hauteur en mm */
  h: number;
  /** epaisseur en mm */
  d: number;
  /** rayon des coins en mm */
  r: number;
}

/** Ce qui est ecrit a la main dans le JSON : uniquement des donnees publiees. */
export interface EcranBrut {
  label: Traduit;
  /** diagonale en pouces */
  diag: number;
  /** resolution [largeur, hauteur] en pixels */
  px: [number, number];
  /** densite publiee par le constructeur */
  ppi: number;
  ratio: Traduit;
  tech: Traduit;
  hz: Traduit;
  /** luminosite de crete en nits */
  peak: number;
  /** luminosite HDR en nits, null si non communiquee */
  hdr: number | null;
  glass: Traduit;
  /** rayon des coins de la dalle en mm */
  r: number;
}

/** Ce que geometrie.ts ajoute. Rien ici n'est saisi a la main. */
export interface Geometrie {
  /** largeur de la zone active, en mm */
  w: number;
  /** hauteur de la zone active, en mm */
  h: number;
  /** diagonale en mm */
  diagMm: number;
  /** surface active en cm2 */
  area: number;
  /** densite recalculee depuis diagonale + resolution */
  ppiCalc: number;
  /** largeur en dp Android */
  dpW: number;
  /** hauteur en dp Android */
  dpH: number;
  ratioNum: number;
}

export type Ecran = EcranBrut & Geometrie;

export interface Source {
  who: string;
  what: Traduit;
  url: string;
}

interface AppareilBase {
  id: string;
  /** rang d'affichage dans toute la page */
  order: number;
  name: string;
  ref: string;
  brand: string;
  weight: number;
  hue: { light: string; dark: string };
  role: Traduit;
  announced: Traduit;
  sources: Source[];
}

/**
 * Union discriminee sur `kind` : une barre n'a ni ecran interne ni chassis
 * deplie, et le compilateur le sait. C'est ce qui rend scr() et bod() totales,
 * sans acces optionnel ni assertion nulle part dans les composants.
 */
export interface AppareilBarre extends AppareilBase {
  kind: "bar";
  body: { closed: Chassis };
  screens: { main: Ecran };
}

export interface AppareilPliable extends AppareilBase {
  kind: "fold";
  body: { closed: Chassis; open: Chassis };
  screens: { cover: Ecran; inner: Ecran };
}

export type Appareil = AppareilBarre | AppareilPliable;

/**
 * Une dalle prise dans son appareil. L'ecran resolu voyage avec la paire, ce qui
 * evite d'avoir a reindexer `screens` (et a prouver au compilateur que la cle
 * existe) dans chaque section.
 */
export interface Panneau {
  d: Appareil;
  k: CleEcran;
  s: Ecran;
}

export interface Reglages {
  /** appareil servant de 100 % a tous les pourcentages */
  reference: string;
  selectionParDefaut: string[];
  /** appareil dont la fiche est ouverte au chargement */
  ficheParDefaut: string;
  echelleParDefaut: number;
  echelleMin: number;
  echelleMax: number;
  sourcesGenerales: Source[];
}

export interface Catalogue {
  appareils: Appareil[];
  parId: Record<string, Appareil>;
  /** dalle de reference : le 100 % de tous les ecarts */
  ref: Ecran;
  refId: string;
  /** toutes les dalles du catalogue, selection comprise ou non */
  tousPanneaux: Panneau[];
  /** plus grande surface du catalogue : normalise la longueur des barres */
  maxArea: number;
  reglages: Reglages;
}

/* -- derivations totales -------------------------------------------- */

/** Les dalles d'un appareil, dans l'ordre de lecture. */
export function panneauxDe(d: Appareil): Panneau[] {
  return d.kind === "bar"
    ? [{ d, k: "main", s: d.screens.main }]
    : [
        { d, k: "cover", s: d.screens.cover },
        { d, k: "inner", s: d.screens.inner },
      ];
}

/** Quelle dalle est active pour un etat du pli donne. */
export function scr(d: Appareil, st: EtatPli): Ecran {
  if (d.kind === "bar") return d.screens.main;
  return st === "open" ? d.screens.inner : d.screens.cover;
}

/** Quel chassis est actif pour un etat du pli donne. */
export function bod(d: Appareil, st: EtatPli): Chassis {
  if (d.kind === "bar") return d.body.closed;
  return st === "open" ? d.body.open : d.body.closed;
}

/** Cle de dalle -> etat du pli correspondant. */
export const etatDe = (k: CleEcran): EtatPli => (k === "inner" ? "open" : "closed");

/**
 * Acces nomme, avec une erreur explicite. La prose editoriale (i18n/) cite des
 * appareils par leur id : ajouter un appareil au catalogue est libre, en retirer
 * un qui est cite doit echouer a la construction plutot que rendre une phrase
 * trouee. Ces deux fonctions restent pures -- elles sont donc utilisables aussi
 * bien cote serveur que dans un composant client.
 */
export function exiger(cat: Catalogue, id: string): Appareil {
  const d = cat.parId[id];
  if (!d)
    throw new Error(
      `L'appareil "${id}" est cité par le contenu éditorial mais absent de data/appareils/. ` +
        `Ajoutez le fichier, ou retirez la mention correspondante dans i18n/.`,
    );
  return d;
}

export function exigerPliable(cat: Catalogue, id: string): AppareilPliable {
  const d = exiger(cat, id);
  if (d.kind !== "fold") throw new Error(`L'appareil "${id}" devrait être un pliable.`);
  return d;
}

export function exigerBarre(cat: Catalogue, id: string): AppareilBarre {
  const d = exiger(cat, id);
  if (d.kind !== "bar") throw new Error(`L'appareil "${id}" devrait être une barre.`);
  return d;
}

/** Le jeton CSS de couleur d'un appareil, genere depuis son `hue`. */
export const teinte = (id: string) => `var(--c-${id})`;
