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
  /**
   * Ecart de surface en % par rapport a la dalle de reference -- celle que
   * l'utilisateur a choisie dans la section 02, pas celle du catalogue.
   *
   * Consequence pour la prose : une phrase qui cite `delta()` ne peut plus nommer
   * le Pixel 7 Pro en dur, elle doit passer par `nomRef`. Une phrase qui parle du
   * Pixel 7 Pro *lui-meme* -- son role d'etalon de 2022, la courbure de ses
   * bords -- doit au contraire calculer contre `P7`, qui ne bouge pas.
   */
  delta(aire: number): number;
  /** resout une chaine traduite dans la langue courante */
  t(v: Traduit): string;
  /** surface d'une image 16:9 inscrite dans la dalle, en cm2 */
  vid(s: Ecran): number;
  /** la dalle de reference : celle que l'utilisateur a choisie */
  REF: Ecran;
  /** nom de la dalle de reference, cite par les libelles d'ecart et par la prose */
  nomRef: string;
  /** vrai quand la reference est encore celle du catalogue, personne n'y ayant touche */
  refParDefaut: boolean;
  /**
   * Raccourcis vers les appareils cites nommement par la prose editoriale.
   * Ils sont deja discrimines : `fold.body.open` est accessible sans test.
   */
  fold: AppareilPliable;
  sam: AppareilPliable;
  sam8: AppareilPliable;
  p11p: AppareilBarre;
  p11xl: AppareilBarre;
  tabs10p: AppareilBarre;
  /**
   * Le Pixel 7 Pro nomme, et non plus seulement « la reference ». Depuis que la
   * reference est un choix de l'utilisateur, les textes qui l'invoquent comme
   * temoin de 2022 doivent le designer explicitement : `REF` bougerait sous eux.
   */
  p7p: AppareilBarre;
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
  /** la dalle de la tablette : le plafond de toutes les surfaces */
  TAB: Ecran;
  /** la dalle du Pixel 7 Pro, fixe quelle que soit la reference courante */
  P7: Ecran;
  /** ecart de surface en % par rapport au Pixel 7 Pro, insensible a la reference */
  deltaP7(aire: number): number;
  /**
   * De quoi ecrire « X % par rapport au N » sans jamais produire de tautologie.
   *
   * Une phrase qui compare une dalle a la reference se degrade des que
   * l'utilisateur choisit cette dalle *comme* reference : « +0,0 % par rapport au
   * Galaxy Tab S10+ » dans un verdict qui parle de la Tab S10+. Ce cas est
   * atteignable en deux clics, et il touchait les quatre affirmations de la
   * section 02 autant que le verdict de la tablette.
   *
   * On cite donc le Pixel 7 Pro dans ce cas : c'est l'etalon historique, et
   * aucun texte ne decrit le 7 Pro lui-meme, donc le repli ne peut pas retomber
   * dans la meme tautologie.
   */
  ecartCite(s: Ecran): { pc: string; nom: string; contre: Ecran };
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

  /*
   * Aucune de ces chaines n'enonce la taille du catalogue.
   *
   * Elles l'ont fait : le titre etait `titre(nbAppareils)` et rendait « Six
   * ecrans a l'echelle ». Le compte etait pourtant deja derive -- ce qui ne
   * suffisait pas, parce qu'ajouter un appareil deplacait alors le titre de la
   * page, sa description, son referencement et l'accroche, et parce que la meme
   * habitude avait produit ailleurs des « des six » ecrits en dur qui, eux,
   * devenaient faux en silence.
   *
   * La regle est donc : la prose ne dit jamais combien le catalogue contient
   * d'appareils ni de dalles. Les comptes qui decrivent la *selection* de
   * l'utilisateur restent -- ils sont deja dynamiques, et grandir le catalogue
   * ne les rend pas faux.
   */
  meta: {
    titre: string;
    description: string;
  };

  entete: {
    eyebrow: string;
    titre: string;
    /** le mot mis en valeur dans le titre */
    titreAccent: string;
    /** `nbDefaut` decrit la selection de depart, pas la taille du catalogue */
    lede(nbDefaut: number): string;
    badgeOfficiel: string;
    badgeCalcule: string;
    badgeRumeur: string;
    choixLangue: string;
    /**
     * Le bouton de theme. Il tourne sur trois etats, et « systeme » n'est pas un
     * troisieme gout : c'est l'absence de choix, donc le reglage du systeme
     * d'exploitation qui reprend la main. Le nom accessible dit l'etat courant,
     * pas celui vers lequel le clic mene -- un bouton se lit par ce qu'il montre.
     */
    theme: {
      /**
       * Le nom accessible, assemble par la langue et non par le composant : le
       * francais met une espace insecable avant le deux-points, l'anglais non.
       * C'est la meme raison qui fait que `%` a la sienne dans `lib/format`.
       */
      libelle(etat: string): string;
      auto: string;
      clair: string;
      sombre: string;
    };
  };

  ctl: {
    appareils: string;
    disposition: string;
    ecranPliables: string;
    /** intitule du choix de la dalle qui vaut 100 %, en section 02 */
    comparerA: string;
    /** intitule du curseur qui pose les pliables a l'angle voulu */
    ouverture: string;
    /** son etat lu, pour les lecteurs d'ecran comme a l'ecran */
    ouverturePc(pc: string): string;
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
    /**
     * `nomRef` est le nom de la dalle choisie comme 100 %. C'est un nom, pas un
     * compte : la regle « aucune prose n'enonce la taille du catalogue » tient.
     */
    intro(nomRef: string): string;
    affirmations(c: Ctx): Affirmation[];
    externe: string;
    interne: string;
    /**
     * Mention portee par la puce de reference quand son appareil n'est pas coche.
     * La reference du catalogue reste l'etalon meme absente de la scene, il faut
     * donc pouvoir la proposer -- et dire qu'elle n'y est pas.
     */
    horsScene: string;
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
