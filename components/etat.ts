import type { Mode } from "@/lib/scene";
import type { Catalogue, EtatPli } from "@/lib/types";

export type CleScene = "web" | "video" | "list" | "multi";
export const CLES_SCENE: CleScene[] = ["web", "video", "list", "multi"];

/**
 * L'etat unique de la comparaison. C'est le pendant direct du `S` de la page
 * d'origine : on le modifie, le rendu suit. Aucune section ne detient d'etat
 * propre, ce qui est exactement ce qui permet aux sections 02, 03 et 04 de
 * suivre la selection sans liste a tenir a jour.
 */
export interface EtatUI {
  mode: Mode;
  etat: EtatPli;
  vis: Record<string, boolean>;
  marks: { w: boolean; h: boolean; d: boolean; a: boolean };
  /** appareil survole : il prend la fiche sans changer la selection */
  focus: string | null;
  /** appareil dont la fiche est affichee hors survol */
  sel: string;
  scene: CleScene;
  /** etat du pli propre a la section « mise en situation » */
  etatScene: EtatPli;
  fiche: boolean;
}

export const jeuVisible = (cat: Catalogue, ids: string[]): Record<string, boolean> =>
  Object.fromEntries(cat.appareils.map((d) => [d.id, ids.includes(d.id)]));

export function etatInitial(cat: Catalogue): EtatUI {
  const { selectionParDefaut, ficheParDefaut } = cat.reglages;
  return {
    mode: "side",
    etat: "open",
    vis: jeuVisible(cat, selectionParDefaut),
    marks: { w: true, h: true, d: true, a: true },
    focus: null,
    sel: ficheParDefaut,
    scene: "web",
    etatScene: "open",
    fiche: true,
  };
}

/**
 * Les temps de l'animation. La legende de chaque temps vient du dictionnaire
 * (banc.etapes) ; ce tableau ne porte que la mecanique et la duree, qui ne se
 * traduisent pas. Les deux tableaux doivent avoir la meme longueur.
 */
export interface Temps {
  /** duree avant le temps suivant, en ms */
  t: number;
  appliquer(s: EtatUI, cat: Catalogue): EtatUI;
}

const coche = (s: EtatUI, ids: string[]): Record<string, boolean> => ({
  ...s.vis,
  ...Object.fromEntries(ids.map((id) => [id, true])),
});

export const TEMPS: Temps[] = [
  {
    t: 1500,
    appliquer: (s, cat) => ({
      ...s,
      vis: jeuVisible(cat, [cat.refId]),
      mode: "center",
      etat: "closed",
      marks: { w: false, h: false, d: false, a: false },
      sel: cat.refId,
    }),
  },
  { t: 2700, appliquer: (s) => ({ ...s, vis: coche(s, ["p11p", "p11xl"]), sel: "p11xl" }) },
  {
    t: 2100,
    appliquer: (s) => ({ ...s, vis: coche(s, ["fold"]), mode: "center", etat: "closed", sel: "fold" }),
  },
  { t: 2300, appliquer: (s) => ({ ...s, etat: "open" }) },
  { t: 2300, appliquer: (s) => ({ ...s, vis: coche(s, ["sam"]), sel: "sam" }) },
  { t: 2500, appliquer: (s) => ({ ...s, vis: coche(s, ["sam8"]), sel: "sam8" }) },
  { t: 1900, appliquer: (s) => ({ ...s, mode: "center" }) },
  { t: 2500, appliquer: (s) => ({ ...s, marks: { w: true, h: true, d: true, a: true } }) },
  {
    t: 0,
    appliquer: (s, cat) => ({
      ...s,
      vis: jeuVisible(cat, cat.reglages.selectionParDefaut),
      mode: "side",
      etat: "open",
      sel: cat.reglages.ficheParDefaut,
    }),
  },
];
