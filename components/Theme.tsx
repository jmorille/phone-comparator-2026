"use client";

import { useEffect, useState } from "react";

import { dictionnaire } from "@/i18n";
import { THEMES, appliquerTheme, ecrireTheme, lireTheme, type Theme } from "@/lib/theme";
import type { Locale } from "@/lib/types";

const GLYPHES: Record<Theme, string> = { auto: "◐", light: "☀", dark: "☾" };

/**
 * Le bouton de theme, dans la rangee de l'en-tete a cote du selecteur de langue.
 * Il tourne sur les trois etats de `lib/theme` : systeme, clair, sombre.
 *
 * Il part sur `auto` au premier rendu **des deux cotes**, et ne lit le stockage
 * qu'apres le montage. C'est la meme regle que l'echelle memorisee : le HTML est
 * prerendu, et lire `localStorage` pendant le rendu ferait diverger le serveur du
 * client, donc un ecart d'hydratation. Le libelle du bouton peut donc changer une
 * fois juste apres le chargement -- mais pas les couleurs, que le script en ligne
 * du layout a deja posees avant la peinture.
 */
export function BoutonTheme({ locale }: { locale: Locale }) {
  const dict = dictionnaire(locale);
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => setTheme(lireTheme()), []);

  const noms: Record<Theme, string> = {
    auto: dict.entete.theme.auto,
    light: dict.entete.theme.clair,
    dark: dict.entete.theme.sombre,
  };

  const suivant = () => {
    const t = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]!;
    setTheme(t);
    ecrireTheme(t);
    appliquerTheme(t);
  };

  return (
    <button
      type="button"
      className="theme"
      onClick={suivant}
      // le nom accessible dit l'etat courant : un bouton se lit par ce qu'il
      // montre, pas par ce vers quoi il mene. Son assemblage revient a la langue,
      // qui seule sait si le deux-points prend une espace devant.
      aria-label={dict.entete.theme.libelle(noms[theme])}
      title={dict.entete.theme.libelle(noms[theme])}
    >
      <span className="gl" aria-hidden="true">
        {GLYPHES[theme]}
      </span>
      {noms[theme]}
    </button>
  );
}
