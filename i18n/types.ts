import type { Formats } from "@/lib/format";
import type {
  AppareilBarre,
  AppareilPliable,
  Catalogue,
  Ecran,
  Locale,
  Repere,
  Traduit,
} from "@/lib/types";

/**
 * Contexte remis aux textes qui citent des chiffres. La prose editoriale ne
 * recalcule jamais : elle recoit les dalles deja mesurees et les formateurs de
 * sa langue, et se contente d'assembler la phrase.
 */
export interface Ctx {
  cat: Catalogue;
  f: Formats;
  /** ecart de surface en % par rapport a la dalle de reference */
  delta(aire: number): number;
  /** resout une chaine traduite dans la langue courante */
  t(v: Traduit): string;
  /** surface d'une image 16:9 inscrite dans la dalle, en cm2 */
  vid(s: Ecran): number;
  /** la dalle de reference (Pixel 7 Pro par defaut) */
  REF: Ecran;
  /** nom de l'appareil de reference, cite par les libelles d'ecart */
  nomRef: string;
  /**
   * Raccourcis vers les appareils cites nommement par la prose editoriale.
   * Ils sont deja discrimines : `fold.body.open` est accessible sans test.
   */
  fold: AppareilPliable;
  sam: AppareilPliable;
  sam8: AppareilPliable;
  p11p: AppareilBarre;
  p11xl: AppareilBarre;
  /** dalles interne (I) et externe (C) des trois pliables */
  FI: Ecran;
  FC: Ecran;
  SI: Ecran;
  SC: Ecran;
  WI: Ecran;
  WC: Ecran;
  /** dalles uniques des deux barres recentes */
  P11: Ecran;
  XL: Ecran;
}

/** Un temps de l'animation. La legende est traduite, la mecanique reste en code. */
export interface Etape {
  cap: string;
}

export interface Affirmation {
  /** couleur de la barre laterale : id d'appareil, ou null pour la couleur d'accent */
  deviceId: string | null;
  texte: string;
}

export interface Verdict {
  q: string;
  deviceId: string;
  a: string;
  w: string;
  /** une nuance tempere une reponse au lieu d'en apporter une */
  nuance?: boolean;
}

export interface TextesScene {
  nom: string;
  note: string;
}

export interface Dictionnaire {
  code: Locale;
  /** nom de la langue dans la langue elle-meme, pour le selecteur */
  nomLangue: string;
  /** "un", "deux"... au masculin (des ecrans) et au feminin (des dalles) */
  nombreM(n: number): string;
  nombreF(n: number): string;

  meta: {
    titre(nbAppareils: number): string;
    description(nbAppareils: number, nbDalles: number): string;
  };

  entete: {
    eyebrow: string;
    titre(nbAppareils: number): string;
    /** le mot mis en valeur dans le titre */
    titreAccent: string;
    lede(nbDalles: number, nbDefaut: number): string;
    badgeOfficiel: string;
    badgeCalcule: string;
    badgeRumeur: string;
    choixLangue: string;
  };

  ctl: {
    appareils: string;
    disposition: string;
    ecranPliables: string;
    reperes: string;
    animation: string;
    ficheTechnique: string;
    contenu: string;
    pliables: string;
    modes: { side: string; stack: string; center: string };
    etats: { closed: string; open: string };
    etatsCourts: { closed: string; open: string };
    /** indexe sur REPERES : ajouter un repere y oblige les deux langues */
    marques: Record<Repere, string>;
    rejouer: string;
    replierFiche: string;
    deplierFiche: string;
    replierFicheTitre: string;
  };

  banc: {
    eyebrow: string;
    titre: string;
    intro: string;
    echelle: string;
    /** description de la bande de tranche, pour les lecteurs d'ecran */
    tranche: string;
    reinitialiser: string;
    unite(valeur: string): string;
    indiceDefilement: string;
    carte: string;
    aideCalibration: string;
    exploration: string;
    etapes(c: Ctx): Etape[];
  };

  fiche: {
    dalle: string;
    diagonale: string;
    resolution: string;
    densite: string;
    ratio: string;
    frequence: string;
    crete: string;
    zoneActive: string;
    surface: string;
    ecartRef(nomRef: string): string;
    largeurLogique: string;
    classeAndroid: string;
    chassis: string;
    dimensions: string;
    protection: string;
    reference: string;
    unique: string;
    deplie: string;
    replie: string;
    /** la ligne d'identite sous le nom : role, date d'annonce, poids */
    ligneRole(role: string, date: string, poids: number): string;
  };

  surface: {
    eyebrow: string;
    titre: string;
    intro(nbDalles: number): string;
    affirmations(c: Ctx): Affirmation[];
    externe: string;
    interne: string;
  };

  usage: {
    eyebrow: string;
    titre: string;
    intro: string;
    note: string;
    scenes: { web: TextesScene; video: TextesScene; list: TextesScene; multi: TextesScene };
    metriques: {
      caracteres(n: string): string;
      lignes(lignes: number, parLigne: number): string;
      image(surface: string): string;
      partDalle(pct: number, relatif: string): string;
      elements(n: number): string;
      hauteurDp(dp: string): string;
      volets(l: string, h: string): string;
      voletsCote: string;
      voletsEmpiles: string;
      reference: string;
      versRef(ecart: string, nomRef: string): string;
    };
    ui: {
      actualite: string;
      titreArticle: string;
      titreArticleCourt: string;
      boiteReception: string;
      messages: string;
      article: string;
    };
    ouvert: string;
    ferme: string;
  };

  tableau: {
    eyebrow: string;
    titre(nbDalles: number): string;
    intro: string;
    groupes: { identite: string; dalle: string; geometrie: string; chassis: string };
    lignes: {
      reference: string;
      annonce: string;
      statut: string;
      poids: string;
      technologie: string;
      diagonale: string;
      resolution: string;
      densitePubliee: string;
      densiteRecalculee: string;
      ratio: string;
      rafraichissement: string;
      luminositeCrete: string;
      luminositeHdr: string;
      protection: string;
      zoneAffichage: string;
      surface: string;
      ecart(nomRef: string): string;
      largeurLogique: string;
      hauteurLogique: string;
      classeLargeur: string;
      encombrement: string;
      caracteristique: string;
    };
    officielle: string;
    nonCommuniquee: string;
    reference: string;
  };

  verdictSection: {
    eyebrow(reponses: number, nuances: number): string;
    titre: string;
    verdicts(c: Ctx): Verdict[];
  };

  sources: {
    eyebrow: string;
    titre: string;
    notes(c: Ctx): string[];
  };

  pied: { releve: string; recalcul: string };

  classes: { compact: string; medium: string; expanded: string };
  /** libelle court, sans l'unite, pour la fiche et les vignettes */
  classesCourtes: { compact: string; medium: string; expanded: string };

  vide: string;
}
