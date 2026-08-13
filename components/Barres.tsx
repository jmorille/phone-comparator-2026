import { useEffect, useRef, useState } from "react";

import type { Ctx, Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import { teinte, type Catalogue, type Locale, type Panneau } from "@/lib/types";

import { Riche, vars } from "./primitives";

const etiquette = (p: Panneau, dict: Dictionnaire, f: Formats, locale: Locale) => {
  const qualifiant =
    p.k === "cover" ? dict.surface.externe + " " : p.k === "inner" ? dict.surface.interne + " " : "";
  void locale;
  return `${p.d.name} — ${qualifiant}${f.dg(p.s.diag)}`;
};

/**
 * Une barre. Elle part de zero et pousse jusqu'a sa longueur une fois la section
 * atteinte : c'est ce qui rend l'ecart lisible. Une dalle qu'on vient de cocher
 * pousse elle aussi, au lieu d'apparaitre deja pleine.
 */
function Barre({
  p,
  cible,
  posRef,
  actif,
  dict,
  f,
  locale,
  estRef,
  ecart,
}: {
  p: Panneau;
  cible: number;
  posRef: number;
  actif: boolean;
  dict: Dictionnaire;
  f: Formats;
  locale: Locale;
  estRef: boolean;
  ecart: number;
}) {
  const [largeur, setLargeur] = useState(0);

  useEffect(() => {
    if (!actif) return;
    const id = requestAnimationFrame(() => setLargeur(cible));
    return () => cancelAnimationFrame(id);
  }, [actif, cible]);

  return (
    <div className="bar-row" style={vars({ "--dc": teinte(p.d.id) })}>
      <div className="bar-lbl">
        <span className="sw" />
        {etiquette(p, dict, f, locale)}
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${largeur}%` }} />
        <div className="bar-ref" style={{ left: `${posRef.toFixed(2)}%` }} />
      </div>
      <div className="bar-val">
        {`${f.f1(p.s.area)} cm² `}
        <span className={"pc" + (ecart < 0 ? " neg" : "")}>
          {estRef ? dict.tableau.reference : f.pc(ecart)}
        </span>
      </div>
    </div>
  );
}

export function Barres({
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
  const boite = useRef<HTMLDivElement>(null);
  const [vu, setVu] = useState(false);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) setVu(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // La longueur de reference est celle de la plus grande dalle du catalogue, pas
  // de la selection : sinon les barres changeraient de longueur a chaque clic et
  // ne seraient plus comparables d'un etat a l'autre.
  const posRef = (cat.ref.area / cat.maxArea) * 100;

  return (
    <div className="bars" ref={boite}>
      {panneaux.length === 0 ? (
        <Riche tag="div" className="empty" html={dict.vide} />
      ) : (
        panneaux.map((p) => (
          <Barre
            key={`${p.d.id}:${p.k}`}
            p={p}
            cible={(p.s.area / cat.maxArea) * 100}
            posRef={posRef}
            actif={vu}
            dict={dict}
            f={f}
            locale={locale}
            estRef={p.d.id === cat.refId}
            ecart={ctx.delta(p.s.area)}
          />
        ))
      )}
    </div>
  );
}
