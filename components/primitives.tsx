import { createElement, type CSSProperties, type ReactNode } from "react";

import type { Chassis, Ecran } from "@/lib/types";

/**
 * Variables CSS typees. Tout le systeme de coordonnees de la page passe par la :
 * rien n'est en pixels, tout est en millimetres de reel convertis par --u.
 * Les nombres sont explicitement mis en chaine, pour qu'aucune couche
 * n'ait l'idee d'y ajouter une unite.
 */
export const vars = (o: Record<string, string | number>): CSSProperties =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? String(v) : v]),
  ) as CSSProperties;

type Balise = "span" | "p" | "div" | "li" | "b";

/**
 * Prose du dictionnaire. Les textes de i18n/ portent quelques balises (<b>,
 * <span class="num">, <sub>) parce qu'une traduction se relit mieux d'un bloc
 * que decoupee en fragments de JSX. Ce contenu est ecrit dans le depot, jamais
 * saisi par un visiteur : il n'y a pas de surface d'injection.
 */
export function Riche({
  html,
  tag = "span",
  className,
  style,
  id,
}: {
  html: string;
  tag?: Balise;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  return createElement(tag, {
    className,
    style,
    id,
    dangerouslySetInnerHTML: { __html: html },
  });
}

/**
 * Un chassis et sa dalle. L'ecran est insere symetriquement dans le chassis --
 * approximation graphique assumee (voir les notes de methode) ; aucune cote
 * chiffree n'en depend.
 */
export function Plaque({
  body,
  s,
  classe,
  ox,
  children,
}: {
  body: Chassis;
  s: Ecran;
  classe?: string;
  /** decalage horizontal du volet droit d'un pliable, en mm */
  ox?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className={"plate" + (classe ? " " + classe : "")}
      style={vars({
        "--pw": body.w,
        "--ph": body.h,
        "--pr": body.r,
        ...(ox !== undefined ? { "--ox": `calc(${ox} * var(--u))` } : {}),
      })}
    >
      <div
        className="scr"
        style={vars({
          "--sx": (body.w - s.w) / 2,
          "--sy": (body.h - s.h) / 2,
          "--sw": s.w,
          "--sh": s.h,
          "--sr": s.r,
        })}
      >
        {children}
      </div>
    </div>
  );
}
