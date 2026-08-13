import type { Mode } from "@/lib/scene";
import {
  REPERES,
  type Catalogue,
  type CleDalle,
  type EtatPli,
  type Marques,
} from "@/lib/types";

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
  /**
   * L'etat **publie** du pli : celui dont les cotes, la fiche et le tableau
   * existent. Il ne prend que ses deux valeurs, et c'est lui qui pilote
   * `disposer()`.
   */
  etat: EtatPli;
  /**
   * L'ouverture **dessinee**, de 0 (replie) a 1 (deplie), quand le lecteur la
   * choisit au curseur. `null` -- le cas courant -- veut dire « suis `etat` », en
   * s'animant sur la charniere.
   *
   * Les deux sont separes parce qu'entre les deux etats publies la mesure n'a
   * plus le meme sens que le dessin : l'epaisseur n'y a plus de definition (les
   * volets forment un V, pas une pile) et la dalle est en partie retournee. Le
   * curseur bouge donc le dessin sans bouger la mesure -- il est la pour regarder
   * le mouvement, pas pour mesurer entre les deux.
   *
   * Ce qui s'efface alors est exactement ce qui est dessine *sur* la dalle du
   * pliable : sa diagonale, sa surface, son epaisseur dans la bande. Ses rails de
   * largeur et de hauteur restent, eux : ils sont a cote de l'appareil et
   * marquent l'encombrement deplie, celui que `disposer()` reserve deja. Voir
   * `.sans-cote` dans globals.css.
   */
  pliLibre: number | null;
  vis: Record<string, boolean>;
  /**
   * La dalle qui vaut 100 %. Le catalogue en fixe une par defaut
   * (`data/reglages.json`), mais rien ne justifie qu'elle soit imposee : la
   * section 02 laisse choisir parmi les dalles cochees. Voir resoudreRef() pour
   * ce qui se passe quand l'appareil choisi est decoche.
   */
  ref: CleDalle;
  marks: Marques;
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

/**
 * Tous les reperes a la meme valeur. L'animation les eteint puis les rallume en
 * bloc, et l'etat de depart les veut tous allumes : ecrire le jeu complet a la
 * main a ces trois endroits obligerait a les retoucher chaque fois qu'un repere
 * s'ajoute, ce qui est precisement l'oubli que REPERES supprime.
 */
export const marquesToutes = (v: boolean): Marques =>
  Object.fromEntries(REPERES.map((k) => [k, v])) as Marques;

export function etatInitial(cat: Catalogue): EtatUI {
  const { selectionParDefaut, ficheParDefaut } = cat.reglages;
  return {
    mode: "side",
    etat: "open",
    pliLibre: null,
    vis: jeuVisible(cat, selectionParDefaut),
    // la reference du catalogue est une barre (le chargeur l'exige), donc "main"
    ref: { id: cat.refId, k: "main" },
    marks: marquesToutes(true),
    focus: null,
    sel: ficheParDefaut,
    scene: "web",
    etatScene: "open",
    fiche: true,
  };
}

/**
 * Les deux temps du pliage, en ms. Ce sont les jumeaux des jetons `--hinge` et
 * `--dur` de globals.css -- **ils doivent bouger ensemble.**
 *
 * Ils ne sont pas la pour redire le CSS : c'est en JavaScript que le sequencage
 * se decide. Un pliable se referme AVANT que la scene se resserre, et la scene
 * s'ecarte AVANT qu'il se deplie, ce qui se fait en retardant l'un des deux etats
 * du pli d'une de ces durees (voir `useRetarde` dans Comparateur).
 */
export const CHARNIERE_MS = 1800;
export const DISPOSITION_MS = 900;

/** Duree totale d'un pliage : la charniere puis le resserrage, ou l'inverse. */
export const GESTE_MS = CHARNIERE_MS + DISPOSITION_MS;

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
    // la narration reprend la main sur le pli : un reglage au curseur ne doit pas
    // figer les appareils a mi-course pendant qu'elle se joue
    appliquer: (s, cat) => ({
      ...s,
      vis: jeuVisible(cat, [cat.refId]),
      mode: "center",
      etat: "closed",
      pliLibre: null,
      marks: marquesToutes(false),
      sel: cat.refId,
    }),
  },
  { t: 2700, appliquer: (s) => ({ ...s, vis: coche(s, ["p11p", "p11xl"]), sel: "p11xl" }) },
  {
    t: 2100,
    appliquer: (s) => ({ ...s, vis: coche(s, ["fold"]), mode: "center", etat: "closed", sel: "fold" }),
  },
  // le seul temps qui deplie. Il est derive de GESTE_MS plutot que saisi : la
  // narration enchainerait sinon sur le temps suivant alors que le volet est
  // encore en vol -- ce qui arrive des qu'on rallonge la charniere sans y penser
  { t: GESTE_MS + 400, appliquer: (s) => ({ ...s, etat: "open" }) },
  { t: 2300, appliquer: (s) => ({ ...s, vis: coche(s, ["sam"]), sel: "sam" }) },
  { t: 2500, appliquer: (s) => ({ ...s, vis: coche(s, ["sam8"]), sel: "sam8" }) },
  // la tablette arrive en dernier, et en mode centre : c'est la superposition qui
  // rend l'ecart lisible, une tablette posee cote a cote sortirait du cadre
  { t: 2700, appliquer: (s) => ({ ...s, vis: coche(s, ["tabs10p"]), sel: "tabs10p" }) },
  { t: 1900, appliquer: (s) => ({ ...s, mode: "center" }) },
  { t: 2500, appliquer: (s) => ({ ...s, marks: marquesToutes(true) }) },
  {
    t: 0,
    appliquer: (s, cat) => ({
      ...s,
      vis: jeuVisible(cat, cat.reglages.selectionParDefaut),
      mode: "side",
      etat: "open",
      pliLibre: null,
      sel: cat.reglages.ficheParDefaut,
    }),
  },
];
