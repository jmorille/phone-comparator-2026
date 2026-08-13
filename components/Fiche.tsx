import { Fragment, type ReactNode } from "react";

import type { Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import { classeAndroid } from "@/lib/geometrie";
import {
  bod,
  cleActive,
  cleDe,
  memeDalle,
  scr,
  teinte,
  type Appareil,
  type EtatPli,
  type Locale,
  type Panneau,
} from "@/lib/types";

import { vars } from "./primitives";

interface Props {
  d: Appareil;
  etat: EtatPli;
  /** la dalle qui vaut 100 % */
  dalleRef: Panneau;
  /** son nom, qualifiant de dalle compris (vient de Ctx) */
  nomRef: string;
  dict: Dictionnaire;
  f: Formats;
  locale: Locale;
}

/**
 * L'ecart de la dalle affichee a la dalle de reference. La comparaison porte sur
 * la *dalle* et non sur l'appareil : sur un pliable dont l'ecran interne est la
 * reference, l'ecran externe a bien un ecart a afficher.
 */
const ecart = (d: Appareil, etat: EtatPli, dalleRef: Panneau) =>
  memeDalle({ id: d.id, k: cleActive(d, etat) }, cleDe(dalleRef));

/** Le mot qui qualifie l'etat du pli, ou rien du tout pour une barre. */
const qualifier = (d: Appareil, etat: EtatPli, dict: Dictionnaire) =>
  d.kind === "bar" ? "" : etat === "open" ? dict.fiche.deplie : dict.fiche.replie;

/** La fiche complete, colonne de droite. */
export function Fiche({
  d,
  etat,
  dalleRef,
  nomRef,
  dict,
  f,
  locale,
  surRepli,
}: Props & { surRepli(): void }) {
  const s = scr(d, etat);
  const body = bod(d, etat);
  const classe = classeAndroid(s.dpW);

  const lignes: [string, ReactNode][] = [
    [dict.fiche.dalle, <span style={{ fontSize: 11 }}>{s.tech[locale]}</span>],
    [dict.fiche.diagonale, f.dg(s.diag)],
    [dict.fiche.resolution, `${s.px[0]} × ${s.px[1]} px`],
    [dict.fiche.densite, `${s.ppi} ppi`],
    [dict.fiche.ratio, s.ratio[locale]],
    [dict.fiche.frequence, s.hz[locale]],
    [dict.fiche.crete, `${f.f0(s.peak)} nits`],
    [dict.fiche.zoneActive, `${f.f1(s.w)} × ${f.f1(s.h)} mm`],
    [dict.fiche.surface, `${f.f1(s.area)} cm²`],
    [
      dict.fiche.ecartRef(nomRef),
      ecart(d, etat, dalleRef)
        ? dict.fiche.reference
        : f.pc((s.area / dalleRef.s.area - 1) * 100),
    ],
    [dict.fiche.largeurLogique, `${f.f0(s.dpW)} dp`],
    [dict.fiche.classeAndroid, dict.classesCourtes[classe]],
  ];

  return (
    <aside className="fiche" id="fiche">
      <div className="fiche-hd" style={vars({ "--dc": teinte(d.id) })}>
        <button
          className="fiche-x"
          onClick={surRepli}
          title={dict.ctl.replierFicheTitre}
          aria-label={dict.ctl.replierFicheTitre}
        >
          ×
        </button>
        <div className="nm">
          <span className="sw" />
          {d.name}
        </div>
        <div className="rf">{d.ref}</div>
        <div className="rf">
          {dict.fiche.ligneRole(d.role[locale], d.announced[locale], d.weight)}
        </div>
      </div>

      <div className="sub">
        {s.label[locale]} — {d.kind === "bar" ? dict.fiche.unique : qualifier(d, etat, dict)}
      </div>
      <dl>
        {lignes.map(([k, v]) => (
          <Fragment key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </Fragment>
        ))}
      </dl>

      <div className="sub">
        {dict.fiche.chassis} {qualifier(d, etat, dict)}
      </div>
      <dl>
        <dt>{dict.fiche.dimensions}</dt>
        <dd>{`${f.f1(body.h)} × ${f.f1(body.w)} × ${f.f1(body.d)} mm`}</dd>
        <dt>{dict.fiche.protection}</dt>
        <dd style={{ fontSize: 11.5 }}>{s.glass[locale]}</dd>
      </dl>
    </aside>
  );
}

/**
 * Le meme releve quand la fiche est repliee : une seule ligne sous la scene, qui
 * ne vole pas de largeur a la comparaison.
 */
export function Bandeau({ d, etat, dalleRef, nomRef, dict, f, locale }: Props) {
  const s = scr(d, etat);
  const body = bod(d, etat);
  const classe = classeAndroid(s.dpW);
  const q = qualifier(d, etat, dict);

  return (
    <div className="slim">
      <span className="nm" style={vars({ "--dc": teinte(d.id) })}>
        <span className="sw" />
        {d.name}
      </span>
      <span className="k">
        {s.label[locale]}
        {q ? ` · ${q}` : ""}
      </span>
      <span>
        <b>{f.dg(s.diag)}</b>
      </span>
      <span>{`${s.px[0]} × ${s.px[1]} px`}</span>
      <span>{`${s.ppi} ppi`}</span>
      <span>{s.ratio[locale]}</span>
      <span>{s.hz[locale]}</span>
      <span>{`${f.f0(s.peak)} nits`}</span>
      <span>
        <b>{`${f.f1(s.w)} × ${f.f1(s.h)} mm`}</b>
      </span>
      <span>
        <b>{`${f.f1(s.area)} cm²`}</b>
      </span>
      <span className="k">
        {dict.fiche.ecartRef(nomRef)}{" "}
        <b>
          {ecart(d, etat, dalleRef)
            ? dict.fiche.reference
            : f.pc((s.area / dalleRef.s.area - 1) * 100)}
        </b>
      </span>
      <span className="k">{`${f.f0(s.dpW)} dp · ${dict.classesCourtes[classe]}`}</span>
      <span className="k">{`${f.f1(body.h)} × ${f.f1(body.w)} × ${f.f1(body.d)} mm`}</span>
    </div>
  );
}
