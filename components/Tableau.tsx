import { useLayoutEffect, useRef, type ReactNode } from "react";

import type { Ctx, Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import { classeAndroid } from "@/lib/geometrie";
import {
  bod,
  etatDe,
  teinte,
  type Appareil,
  type Catalogue,
  type Locale,
  type Panneau,
} from "@/lib/types";

import { Riche, vars } from "./primitives";

/** Marque les valeurs calculees ici, par opposition a celles publiees. */
const Dia = () => (
  <span className="num" style={{ color: "var(--acc)" }}>
    ◆
  </span>
);
const calcule = (label: string): ReactNode => (
  <>
    {label} <Dia />
  </>
);

type Ligne =
  | { cle: string; groupe: string }
  | {
      cle: string;
      label: ReactNode;
      valeur(p: Panneau): ReactNode;
      wrap?: boolean;
      hi?: boolean;
      /**
       * La ligne decrit l'appareil, pas la dalle : sa valeur est alors fusionnee
       * sur toutes les colonnes du meme appareil au lieu d'y etre repetee.
       */
      parAppareil?: boolean;
    };

const estGroupe = (l: Ligne): l is { cle: string; groupe: string } => "groupe" in l;

function lignes(
  dict: Dictionnaire,
  f: Formats,
  ctx: Ctx,
  cat: Catalogue,
  locale: Locale,
): Ligne[] {
  const L = dict.tableau.lignes;
  const nomRef = cat.parId[cat.refId]!.name;

  return [
    { cle: "g1", groupe: dict.tableau.groupes.identite },
    { cle: "ref", label: L.reference, valeur: (p) => p.d.ref, wrap: true, parAppareil: true },
    { cle: "ann", label: L.annonce, valeur: (p) => p.d.announced[locale], parAppareil: true },
    { cle: "sta", label: L.statut, valeur: () => dict.tableau.officielle, parAppareil: true },
    { cle: "poi", label: L.poids, valeur: (p) => `${p.d.weight} g`, parAppareil: true },

    { cle: "g2", groupe: dict.tableau.groupes.dalle },
    { cle: "tec", label: L.technologie, valeur: (p) => p.s.tech[locale], wrap: true },
    { cle: "dia", label: L.diagonale, valeur: (p) => f.dg(p.s.diag), hi: true },
    { cle: "res", label: L.resolution, valeur: (p) => `${p.s.px[0]} × ${p.s.px[1]} px` },
    { cle: "ppi", label: L.densitePubliee, valeur: (p) => `${p.s.ppi} ppi` },
    {
      cle: "ppc",
      label: calcule(L.densiteRecalculee),
      valeur: (p) => `${Math.round(p.s.ppiCalc)} ppi`,
    },
    { cle: "rat", label: L.ratio, valeur: (p) => p.s.ratio[locale] },
    { cle: "hz", label: L.rafraichissement, valeur: (p) => p.s.hz[locale] },
    { cle: "pk", label: L.luminositeCrete, valeur: (p) => `${f.f0(p.s.peak)} nits`, hi: true },
    {
      cle: "hdr",
      label: L.luminositeHdr,
      valeur: (p) => (p.s.hdr ? `${f.f0(p.s.hdr)} nits` : dict.tableau.nonCommuniquee),
    },
    { cle: "gls", label: L.protection, valeur: (p) => p.s.glass[locale], wrap: true },

    { cle: "g3", groupe: dict.tableau.groupes.geometrie },
    {
      cle: "zon",
      label: calcule(L.zoneAffichage),
      valeur: (p) => `${f.f1(p.s.w)} × ${f.f1(p.s.h)} mm`,
      hi: true,
    },
    { cle: "sur", label: calcule(L.surface), valeur: (p) => `${f.f1(p.s.area)} cm²`, hi: true },
    {
      cle: "ecart",
      label: calcule(L.ecart(nomRef)),
      valeur: (p) =>
        p.d.id === cat.refId ? dict.tableau.reference : f.pc(ctx.delta(p.s.area)),
    },
    { cle: "dpw", label: calcule(L.largeurLogique), valeur: (p) => `${f.f0(p.s.dpW)} dp` },
    { cle: "dph", label: calcule(L.hauteurLogique), valeur: (p) => `${f.f0(p.s.dpH)} dp` },
    {
      cle: "cls",
      label: L.classeLargeur,
      valeur: (p) => dict.classes[classeAndroid(p.s.dpW)],
    },

    { cle: "g4", groupe: dict.tableau.groupes.chassis },
    {
      cle: "enc",
      label: L.encombrement,
      valeur: (p) => {
        const b = bod(p.d, etatDe(p.k));
        return `${f.f1(b.h)} × ${f.f1(b.w)} × ${f.f1(b.d)} mm`;
      },
      wrap: true,
    },
  ];
}

export function Tableau({
  panneaux,
  cat,
  ctx,
  dict,
  f,
  locale,
}: {
  panneaux: Panneau[];
  cat: Catalogue;
  ctx: Ctx;
  dict: Dictionnaire;
  f: Formats;
  locale: Locale;
}) {
  const tbl = useRef<HTMLTableElement>(null);

  // Le second rang d'en-tete doit se coller sous le premier pendant le
  // defilement : sa hauteur n'est connue qu'apres rendu.
  useLayoutEffect(() => {
    const el = tbl.current;
    const r1 = el?.querySelector("thead tr");
    if (el && r1) el.style.setProperty("--hd1", `${r1.getBoundingClientRect().height}px`);
  }, [panneaux, locale]);

  if (panneaux.length === 0) {
    return (
      <table ref={tbl}>
        <tbody>
          <tr>
            <td style={{ padding: 0, border: 0 }}>
              <Riche tag="div" className="empty" html={dict.vide} />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  /*
   * Un pliable occupe deux colonnes, une par dalle. Repeter son nom au-dessus des
   * deux se lisait comme un doublon : on regroupe donc les colonnes d'un meme
   * appareil sous un seul en-tete, le second rang nommant chaque dalle.
   */
  const groupes: { d: Appareil; ps: Panneau[] }[] = [];
  for (const p of panneaux) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.d === p.d) dernier.ps.push(p);
    else groupes.push({ d: p.d, ps: [p] });
  }

  // index des colonnes qui ouvrent un appareil : elles portent le filet vertical
  const ouvrantes = new Set<number>();
  let n = 0;
  for (const g of groupes) {
    ouvrantes.add(n);
    n += g.ps.length;
  }

  const rangs = lignes(dict, f, ctx, cat, locale);

  return (
    <table ref={tbl}>
      <thead>
        <tr>
          <th rowSpan={2} style={{ minWidth: 190 }}>
            {dict.tableau.lignes.caracteristique}
          </th>
          {groupes.map((g) => (
            <th
              key={g.d.id}
              className="dev-grp"
              colSpan={g.ps.length}
              style={vars({ "--dc": teinte(g.d.id) })}
            >
              {g.d.name}
            </th>
          ))}
        </tr>
        <tr>
          {groupes.flatMap((g) =>
            g.ps.map((p, i) => (
              <th
                key={`${p.d.id}:${p.k}`}
                className={"dev-col" + (i === 0 ? " opens" : "")}
                style={vars({ "--dc": teinte(g.d.id) })}
              >
                {p.s.label[locale]}
                <span className="sub2">{f.dg(p.s.diag)}</span>
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {rangs.map((r) => {
          if (estGroupe(r)) {
            return (
              <tr className="grp" key={r.cle}>
                <th>{r.groupe}</th>
                {panneaux.map((p) => (
                  <td key={`${p.d.id}:${p.k}`} />
                ))}
              </tr>
            );
          }
          const styleWrap = r.wrap ? { whiteSpace: "normal" as const } : undefined;

          if (r.parAppareil) {
            return (
              <tr key={r.cle}>
                <th style={styleWrap}>{r.label}</th>
                {groupes.map((g) => (
                  <td
                    key={g.d.id}
                    className={(r.hi ? "hi " : "") + "opens"}
                    colSpan={g.ps.length}
                    style={styleWrap}
                  >
                    {r.valeur(g.ps[0]!)}
                  </td>
                ))}
              </tr>
            );
          }
          return (
            <tr key={r.cle}>
              <th style={styleWrap}>{r.label}</th>
              {panneaux.map((p, i) => (
                <td
                  key={`${p.d.id}:${p.k}`}
                  className={
                    (r.hi ? "hi" : "") + (ouvrantes.has(i) ? (r.hi ? " opens" : "opens") : "")
                  }
                  style={styleWrap}
                >
                  {r.valeur(p)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
