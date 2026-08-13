import { formats } from "@/lib/format";
import { surfaceVideo } from "@/lib/geometrie";
import {
  LOCALES,
  exigerBarre,
  exigerPliable,
  type Catalogue,
  type Locale,
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
 * Le contexte remis a la prose. Volontairement pur : il ne lit aucun fichier, il
 * part du catalogue deja charge. C'est ce qui permet aux composants client de le
 * reconstruire depuis leurs props, sans embarquer node:fs dans le paquet.
 */
export function contexte(cat: Catalogue, locale: Locale): Ctx {
  const f = formats(locale);
  const fold = exigerPliable(cat, "fold");
  const sam = exigerPliable(cat, "sam");
  const sam8 = exigerPliable(cat, "sam8");
  const p11p = exigerBarre(cat, "p11p");
  const p11xl = exigerBarre(cat, "p11xl");
  const tabs10p = exigerBarre(cat, "tabs10p");

  return {
    cat,
    f,
    delta: (aire) => (aire / cat.ref.area - 1) * 100,
    t: (v: Traduit) => v[locale],
    vid: surfaceVideo,
    REF: cat.ref,
    nomRef: cat.parId[cat.refId]!.name,
    fold,
    sam,
    sam8,
    p11p,
    p11xl,
    tabs10p,
    FI: fold.screens.inner,
    FC: fold.screens.cover,
    SI: sam.screens.inner,
    SC: sam.screens.cover,
    WI: sam8.screens.inner,
    WC: sam8.screens.cover,
    P11: p11p.screens.main,
    XL: p11xl.screens.main,
    TAB: tabs10p.screens.main,
  };
}
