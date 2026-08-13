import { bod, scr, type Appareil, type Chassis, type Ecran, type EtatPli } from "./types";

export type Mode = "side" | "stack" | "center";

/**
 * Hauteur fixe de la scene, en mm de reel. Elle ne suit pas le catalogue -- une
 * toile qui grandirait toute seule changerait l'echelle en silence a chaque
 * ajout. On la releve donc a la main, et voici le calcul qui l'a fixee ici.
 *
 * L'appareil le plus haut est la Galaxy Tab S10+, 185,4 mm. Les appareils sont
 * centres puis remontes de BIAIS, donc le vide au-dessus du plus haut vaut
 * (HAUTEUR_MM - 185,4) / 2 - 17. A 212 il valait **-3,7 mm** : la tablette
 * sortait par le haut et la coque en rognait 3,3. A 240 il vaut 10,3 mm, soit un
 * carreau plein de quadrillage au-dessus d'elle.
 *
 * 240 est de surcroit un multiple du pas de 10 mm : le quadrillage traverse donc
 * la bande de tranche sans rupture de phase, les deux boites se contentant d'un
 * `background-position: center top`.
 */
export const HAUTEUR_MM = 240;
/**
 * Place reservee sous la scene a la bande de tranche, en mm de reel. Elle est
 * constante -- elle ne suit ni la selection, ni le pli, ni meme le fait que la
 * bande soit repliee -- pour la meme raison que l'echelle elle-meme est fixe :
 * la comparaison ne veut plus rien dire si le millimetre change de taille en
 * cours de route. Replier la bande rend donc de la place a l'ecran, pas a
 * l'echelle.
 */
const TRANCHE_MM = 16;
/** Marge basse reservee aux rails de cotes de largeur. */
const BIAIS = 17;
/** Ecart entre deux appareils cote a cote, en mm. */
const ECART = 10;
/** Bande verticale ou se posent les rails de largeur. */
const RAIL_HAUT = 176;
const RAIL_BAS = 206;

export interface BoiteDisposee {
  d: Appareil;
  /** position en mm dans la scene */
  x: number;
  y: number;
  visible: boolean;
  z: number;
  s: Ecran;
  body: Chassis;
  /** decalage du rail de largeur, en mm sous le bas de la dalle */
  woff: number;
  /** decalage du rail de hauteur, en mm a droite de la dalle */
  hoff: number;
  /** rang parmi les appareils visibles : decale les etiquettes qui se chevaucheraient */
  stag: number;
}

export interface Disposition {
  /** largeur de la scene en mm : au moins la fenetre, davantage si le contenu deborde */
  canvasMm: number;
  /** vrai quand la scene est plus large que sa fenetre et defile lateralement */
  defile: boolean;
  /** un seul appareil en scene : il n'a rien a laisser voir derriere lui */
  seulVisible: boolean;
  /**
   * Plus grande epaisseur du catalogue, tous etats de pli confondus : c'est la
   * hauteur de la bande de tranche. Prise sur le catalogue entier et non sur la
   * selection, pour que la bande ne saute pas de taille quand on coche un
   * appareil ou qu'on deplie.
   */
  epaisseurMaxMm: number;
  boites: BoiteDisposee[];
}

/**
 * Positionne tous les appareils. Fonction pure : mêmes entrées, même sortie, et
 * aucune lecture du DOM -- la seule mesure venue du navigateur, la largeur
 * disponible, est passée en argument. C'est le seul endroit qui place un appareil.
 *
 * `largeurPx` vaut null tant que la fenêtre n'a pas été mesurée (premier rendu,
 * y compris côté serveur) : la scène se dimensionne alors sur son seul contenu,
 * ce qui donne le même résultat au serveur et au client, donc pas d'écart
 * d'hydratation.
 */
export function disposer(params: {
  appareils: Appareil[];
  visibles: Record<string, boolean>;
  mode: Mode;
  etat: EtatPli;
  ppmm: number;
  largeurPx: number | null;
}): Disposition {
  const { appareils, visibles, mode, etat, ppmm, largeurPx } = params;

  const brutes = appareils.map((d) => {
    const body = bod(d, etat);
    return { d, body, s: scr(d, etat), visible: !!visibles[d.id] };
  });
  const vivantes = brutes.filter((b) => b.visible);

  const requis =
    vivantes.reduce((a, b) => a + b.body.w, 0) + ECART * Math.max(0, vivantes.length - 1);
  const dispoMm = largeurPx === null ? 0 : largeurPx / ppmm;
  const plusLarge = Math.max(...brutes.map((b) => b.body.w), 1);

  // superpose : il faut de la place a droite pour les rails de cotes de hauteur
  const canvasMm =
    mode === "side"
      ? Math.max(dispoMm, requis + 10)
      : Math.max(dispoMm, plusLarge + 2 * (14 + 10 * appareils.length));

  const cy = (h: number) => (HAUTEUR_MM - h) / 2 - BIAIS;
  const positions = new Map<string, { x: number; y: number }>();

  if (mode === "side") {
    let x = (canvasMm - requis) / 2;
    for (const b of vivantes) {
      positions.set(b.d.id, { x, y: cy(b.body.h) });
      x += b.body.w + ECART;
    }
  } else if (mode === "stack") {
    const mw = Math.max(...vivantes.map((b) => b.body.w), 1);
    const mh = Math.max(...vivantes.map((b) => b.body.h), 1);
    const ox = (canvasMm - mw) / 2;
    const oy = cy(mh);
    for (const b of vivantes) positions.set(b.d.id, { x: ox, y: oy });
  } else {
    for (const b of vivantes) {
      positions.set(b.d.id, { x: (canvasMm - b.body.w) / 2, y: cy(b.body.h) });
    }
  }
  // les appareils décochés restent centrés, prêts à réapparaître sans saut
  for (const b of brutes) {
    if (!positions.has(b.d.id)) {
      positions.set(b.d.id, { x: (canvasMm - b.body.w) / 2, y: cy(b.body.h) });
    }
  }

  // profondeur : la plus grande surface derrière, pour que rien ne masque un petit
  const ordreZ = [...brutes].sort((a, b) => b.body.w * b.body.h - a.body.w * a.body.h);
  const zParId = new Map(ordreZ.map((b, i) => [b.d.id, 10 + i]));

  /*
   * Rails de cotes. Le decalage se fait sur le rang parmi les appareils
   * *visibles*, pas sur l'index du catalogue : l'objectif est d'eviter que deux
   * etiquettes simultanement a l'ecran se recouvrent, et un appareil decoche
   * n'occupe aucune place. Le pas se resserre quand la selection s'agrandit,
   * pour que la derniere ligne reste dans la bande basse de la scene.
   */
  const pas =
    vivantes.length > 1
      ? Math.min(10, (RAIL_BAS - RAIL_HAUT) / (vivantes.length - 1))
      : 0;
  const rangs = new Map(vivantes.map((b, i) => [b.d.id, i]));

  const railsPartages = mode !== "side";
  const reference = vivantes.length ? vivantes : brutes;
  const plusADroite = Math.max(
    ...reference.map((b) => {
      const p = positions.get(b.d.id)!;
      return p.x + (b.body.w + b.s.w) / 2;
    }),
  );

  const boites: BoiteDisposee[] = brutes.map((b) => {
    const p = positions.get(b.d.id)!;
    const rang = rangs.get(b.d.id) ?? 0;
    const basDalle = p.y + (b.body.h + b.s.h) / 2;
    const droiteDalle = p.x + (b.body.w + b.s.w) / 2;
    return {
      d: b.d,
      x: p.x,
      y: p.y,
      visible: b.visible,
      z: zParId.get(b.d.id)!,
      s: b.s,
      body: b.body,
      woff: RAIL_HAUT + rang * pas - basDalle,
      hoff: railsPartages ? plusADroite + 8 + 10 * rang - droiteDalle : 5.5,
      stag: rang,
    };
  });

  return {
    canvasMm,
    defile: largeurPx !== null && canvasMm * ppmm > largeurPx + 1,
    seulVisible: vivantes.length === 1,
    epaisseurMaxMm: Math.max(
      ...appareils.flatMap((d) => Object.values(d.body).map((b) => b.d)),
      1,
    ),
    boites,
  };
}

/**
 * Echelle de depart du banc de mesure.
 *
 * L'echelle est unique et stable : elle ne change ni au depliage, ni au
 * changement de disposition, ni quand on coche un appareil -- sinon la
 * comparaison ne veut plus rien dire. On la cale une fois sur la seule selection
 * de depart, depliee et cote a cote, pour que la vue d'arrivee soit la plus
 * grande possible. Cocher un appareil de plus fait defiler la scene
 * lateralement plutot que de tout retrecir, et le curseur permet toujours de
 * monter jusqu'au 1:1.
 */
export function echelleAuto(params: {
  base: Appareil[];
  hauteurFenetre: number;
  largeurScene: number;
  plafond: number;
}): number {
  const { base, hauteurFenetre, largeurScene, plafond } = params;
  // la bande de tranche s'ajoute sous la scene : son millimetre est le meme, sa
  // reserve entre donc dans le meme budget de hauteur
  const parHauteur = Math.max(360, hauteurFenetre * 0.82) / (HAUTEUR_MM + TRANCHE_MM);
  const requisMm =
    base.reduce((a, d) => a + Math.max(bod(d, "open").w, bod(d, "closed").w), 0) +
    ECART * (base.length - 1) +
    12;
  const parLargeur = Math.max(240, largeurScene) / requisMm;
  return Math.max(1.4, Math.min(plafond, parHauteur, parLargeur));
}

/**
 * Echelle propre a la section « mise en situation », independante de celle du
 * banc. Meme principe : calee une fois sur la selection de depart, la rangee
 * defile au-dela. On tient la plus large des deux configurations (repliee et
 * depliee) pour que le passage de l'une a l'autre ne change pas l'echelle.
 */
export function echelleScenes(params: {
  base: Appareil[];
  hauteurFenetre: number;
  largeurBoite: number;
}): number {
  const { base, hauteurFenetre, largeurBoite } = params;
  const largeurJeu = (st: EtatPli) =>
    base.reduce((a, d) => a + bod(d, st).w, 0) + 14 * (base.length - 1) + 40;
  const requis = Math.max(largeurJeu("closed"), largeurJeu("open"));
  const plusHaut = Math.max(
    ...base.flatMap((d) => Object.values(d.body).map((b) => b.h)),
  );
  const parHauteur = Math.min(660, Math.max(340, hauteurFenetre * 0.7)) / plusHaut;
  return Math.max(1.5, Math.min(4.4, (largeurBoite - 40) / requis, parHauteur));
}
