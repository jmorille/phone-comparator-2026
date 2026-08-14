/**
 * Le theme, et le seul endroit qui sache comment il est ecrit.
 *
 * Trois etats, et le premier n'est pas une couleur : `auto` est **l'absence de
 * choix**, donc aucun attribut sur la racine, donc le reglage du systeme qui
 * reprend la main. C'est exactement la forme que globals.css attend deja --
 * `:root` en clair, `@media (prefers-color-scheme:dark) :root:not([data-theme="light"])`
 * pour le systeme sombre, `:root[data-theme="dark"]` pour le choix force. Poser
 * l'attribut suffit donc : il n'y a aucune couleur a ecrire pour ce bouton.
 *
 * Ce module ne contient ni composant ni `node:fs` : le layout (serveur) y prend
 * son script, le bouton (client) y prend tout le reste. La cle n'est ecrite
 * qu'ici, ce qui est le point -- un script en ligne qui lirait une cle recopiee
 * a la main divergerait en silence le jour ou elle change.
 */
export const THEMES = ["auto", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Meme famille que `ecrans-echelle:ppmm`, l'echelle memorisee. */
export const CLE_THEME = "ecrans-echelle:theme";

const estTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);

/**
 * localStorage peut lever -- navigation privee, iframe bac a sable, stockage
 * plein. Comme pour l'echelle, tout passe par un try/catch et la page se
 * comporte exactement comme avant s'il est indisponible : elle suit le systeme.
 */
export const lireTheme = (): Theme => {
  try {
    const v = localStorage.getItem(CLE_THEME);
    return estTheme(v) ? v : "auto";
  } catch {
    return "auto";
  }
};

export const ecrireTheme = (t: Theme) => {
  try {
    if (t === "auto") localStorage.removeItem(CLE_THEME);
    else localStorage.setItem(CLE_THEME, t);
  } catch {
    /* stockage indisponible : le choix vaut pour la session, sans plus */
  }
};

/** Pose l'etat sur la racine. `auto` retire l'attribut, il ne le remplace pas. */
export const appliquerTheme = (t: Theme) => {
  const r = document.documentElement;
  if (t === "auto") r.removeAttribute("data-theme");
  else r.setAttribute("data-theme", t);
};

/**
 * Le meme geste, mais **avant la peinture**.
 *
 * Sans lui, quelqu'un qui a choisi « sombre » sur une machine en clair verrait
 * un eclair blanc a chaque chargement : React ne monte qu'apres le premier
 * rendu, et l'attribut arriverait donc apres. Ce script est synchrone dans le
 * `<head>`, donc il s'execute avant que le corps existe.
 *
 * Il lit la cle par la constante ci-dessus plutot que par une chaine recopiee,
 * et il ne peut rien casser : tout est dans un try/catch, et une valeur
 * inconnue ne pose simplement aucun attribut.
 */
export const SCRIPT_THEME =
  `try{var t=localStorage.getItem(${JSON.stringify(CLE_THEME)});` +
  `if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
