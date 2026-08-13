import type { EcranBrut, Geometrie } from "./types";

/** 1 dp Android = 1/160 pouce, soit 0,15875 mm. Vrai sur toutes les dalles. */
export const MM_DP = 25.4 / 160;

/**
 * Tout ce qui est mesurable se deduit de deux donnees publiees : la diagonale et
 * la resolution. Aucune largeur, aucune surface, aucune densite recalculee n'est
 * saisie a la main dans le catalogue -- ajouter un appareil ne demande donc que
 * ses specifications officielles.
 *
 *   L = D x l_px / racine(l_px^2 + h_px^2)
 */
export function geometrie(diagIn: number, px: readonly [number, number]): Geometrie {
  const diagMm = diagIn * 25.4;
  const diagPx = Math.hypot(px[0], px[1]);
  const w = (diagMm * px[0]) / diagPx;
  const h = (diagMm * px[1]) / diagPx;
  return {
    w,
    h,
    diagMm,
    area: (w * h) / 100, // mm2 -> cm2
    ppiCalc: diagPx / diagIn,
    dpW: w / MM_DP,
    dpH: h / MM_DP,
    ratioNum: px[1] / px[0],
  };
}

export const avecGeometrie = (e: EcranBrut) => ({ ...e, ...geometrie(e.diag, e.px) });

/**
 * Seuils reels d'Android, pas une estimation : ils declenchent les mises en page
 * tablette. Le libelle est traduit par le dictionnaire, on ne renvoie que la cle.
 */
export type ClasseAndroid = "compact" | "medium" | "expanded";
export const classeAndroid = (dpW: number): ClasseAndroid =>
  dpW >= 840 ? "expanded" : dpW >= 600 ? "medium" : "compact";

/** Rectangle 16:9 inscrit dans une dalle, appareil tourne en paysage. Surface en cm2. */
export function surfaceVideo(s: { w: number; h: number }): number {
  const W = Math.max(s.w, s.h);
  const H = Math.min(s.w, s.h);
  const vh = W / H > 16 / 9 ? H : (W * 9) / 16;
  const vw = W / H > 16 / 9 ? (H * 16) / 9 : W;
  return (vw * vh) / 100;
}

/** Le meme rectangle, mais rendu en portrait dans la scene de mise en situation. */
export function cadreVideoPortrait(s: { w: number; h: number }): { w: number; h: number } {
  const w = Math.min(s.w, (s.h * 16) / 9);
  return { w, h: (w * 9) / 16 };
}
