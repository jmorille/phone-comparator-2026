import { formats } from "@/lib/format";
import { surfaceVideo } from "@/lib/geometrie";
import {
  LOCALES,
  exigerBarre,
  exigerPliable,
  panneauxDe,
  type Catalogue,
  type Locale,
  type Panneau,
  type Traduit,
} from "@/lib/types";

import { en } from "./en";
import { fr } from "./fr";
import type { Ctx, Dictionnaire } from "./types";

export type { Ctx, Dictionnaire } from "./types";

export const LOCALE_DEFAUT: Locale = "fr";

const DICTIONNAIRES: Record<Locale, Dictionnaire> = { fr, en };

export const dictionnaire = (l: Locale): Dictionnaire => DICTIONNAIRES[l];

export const estLocale = (v: string): v is Locale =>
  (LOCALES as readonly string[]).includes(v);

/** Toutes les langues, pour le selecteur et generateStaticParams. */
export const langues = LOCALES.map((code) => ({ code, nom: DICTIONNAIRES[code].nomLangue }));

/**
 * Nom d'une dalle pour les libelles « vs … ». Le qualifiant n'apparait que quand
 * l'appareil a plusieurs dalles : « Pixel 7 Pro » se suffit, « Pixel 11 Pro
 * Fold » non -- se comparer a son ecran externe ou a son ecran interne ne sont
 * pas la meme question.
 */
export function nomDalle(p: Panneau, locale: Locale): string {
  if (panneauxDe(p.d).length < 2) return p.d.name;
  const d = DICTIONNAIRES[locale].surface;
  return `${p.d.name} (${p.k === "cover" ? d.externe : d.interne})`;
}

/**
 * Le contexte remis a la prose. Volontairement pur : il ne lit aucun fichier, il
 * part du catalogue deja charge. C'est ce qui permet aux composants client de le
 * reconstruire depuis leurs props, sans embarquer node:fs dans le paquet.
 *
 * `ref` est la dalle choisie par l'utilisateur dans la section 02. Omise, on
 * retombe sur la reference du catalogue -- c'est ce que fait le rendu serveur,
 * qui n'a pas d'etat d'interface, et c'est aussi l'etat de depart du client, donc
 * les deux rendus s'accordent (pas d'ecart d'hydratation).
 */
export function contexte(cat: Catalogue, locale: Locale, ref?: Panneau): Ctx {
  const f = formats(locale);
  const fold = exigerPliable(cat, "fold");
  const sam = exigerPliable(cat, "sam");
  const sam8 = exigerPliable(cat, "sam8");
  const p11p = exigerBarre(cat, "p11p");
  const p11xl = exigerBarre(cat, "p11xl");
  const tabs10p = exigerBarre(cat, "tabs10p");
  const p7p = exigerBarre(cat, "p7p");

  const REF = ref ? ref.s : cat.ref;
  const P7 = p7p.screens.main;
  const nomRef = ref ? nomDalle(ref, locale) : cat.parId[cat.refId]!.name;
  const delta = (aire: number) => (aire / REF.area - 1) * 100;
  const deltaP7 = (aire: number) => (aire / P7.area - 1) * 100;

  return {
    cat,
    f,
    delta,
    deltaP7,
    ecartCite: (s) =>
      s === REF
        ? { pc: f.pc(deltaP7(s.area)), nom: p7p.name, contre: P7 }
        : { pc: f.pc(delta(s.area)), nom: nomRef, contre: REF },
    t: (v: Traduit) => v[locale],
    vid: surfaceVideo,
    REF,
    nomRef,
    refParDefaut: !ref || ref.d.id === cat.refId,
    fold,
    sam,
    sam8,
    p11p,
    p11xl,
    tabs10p,
    p7p,
    FI: fold.screens.inner,
    FC: fold.screens.cover,
    SI: sam.screens.inner,
    SC: sam.screens.cover,
    WI: sam8.screens.inner,
    WC: sam8.screens.cover,
    P11: p11p.screens.main,
    XL: p11xl.screens.main,
    TAB: tabs10p.screens.main,
    P7,
  };
}
