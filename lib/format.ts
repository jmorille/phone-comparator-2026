import type { Locale } from "./types";

/**
 * Les nombres sont formates a la main, jamais par toLocaleString : le separateur
 * de milliers que rend Intl depend de la version d'ICU du moteur, et un serveur
 * et un navigateur qui ne s'accordent pas produisent une erreur d'hydratation.
 * Ici, fr et en donnent le meme resultat partout.
 */
const SEP_MILLIERS: Record<Locale, string> = {
  fr: " ", // espace fine insecable
  en: ",",
};
const DECIMALE: Record<Locale, string> = { fr: ",", en: "." };
/** Le francais exige une espace insecable devant le %, l'anglais n'en met pas. */
const AVANT_POURCENT: Record<Locale, string> = { fr: " ", en: "" };

const grouper = (entier: string, sep: string) =>
  entier.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

export interface Formats {
  /** un chiffre apres la virgule : 6,7 */
  f1(n: number): string;
  /** deux chiffres : 2,10 */
  f2(n: number): string;
  /** entier groupe : 3 600 */
  f0(n: number): string;
  /** diagonale en pouces, sans decimale inutile : 8" */
  dg(n: number): string;
  /** ecart signe, avec le vrai signe moins : +15,2 % */
  pc(n: number): string;
  /** millimetres : 71,9 mm */
  mm(n: number): string;
  /** centimetres carres : 89,4 cm2 */
  cm2(n: number): string;
  locale: Locale;
}

export function formats(locale: Locale): Formats {
  const dec = DECIMALE[locale];
  const sep = SEP_MILLIERS[locale];
  const fixe = (n: number, d: number) => {
    const brut = n.toFixed(d);
    const negatif = brut.startsWith("-");
    const [ent = "0", frac] = (negatif ? brut.slice(1) : brut).split(".");
    const corps = grouper(ent, sep) + (frac ? dec + frac : "");
    return (negatif ? "−" : "") + corps;
  };

  const f1 = (n: number) => fixe(n, 1);
  const f2 = (n: number) => fixe(n, 2);
  const f0 = (n: number) => fixe(Math.round(n), 0);

  return {
    locale,
    f1,
    f2,
    f0,
    dg: (n) => f1(n).replace(dec + "0", "") + "″",
    pc: (n) =>
      (n >= 0 ? "+" : "−") + f1(Math.abs(n)) + AVANT_POURCENT[locale] + "%",
    mm: (n) => f1(n) + " mm",
    cm2: (n) => f1(n) + " cm²",
  };
}
