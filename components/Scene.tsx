import type { Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import type { Disposition, Mode } from "@/lib/scene";
import { teinte, type Appareil, type EtatPli } from "@/lib/types";

import { Plaque, vars } from "./primitives";

/**
 * Un appareil sur le banc de mesure. Une barre est une simple plaque ; un
 * pliable est deux volets dont le droit pivote sur sa charniere, avec la plaque
 * de couverture qui s'efface en fondu. Ajouter .open a .fold joue l'ouverture,
 * toute la mecanique est en CSS.
 */
function Chassis({ d, ouvert }: { d: Appareil; ouvert: boolean }) {
  if (d.kind === "bar") {
    return (
      <Plaque body={d.body.closed} s={d.screens.main}>
        <div className="punch" />
      </Plaque>
    );
  }
  const op = d.body.open;
  return (
    <div
      className={"fold" + (ouvert ? " open" : "")}
      style={vars({ "--ow": op.w, "--oh": op.h, "--hw": op.w / 2 })}
    >
      {(["l", "r"] as const).map((cote) => (
        <div key={cote} className={"leaf " + cote}>
          <Plaque
            body={op}
            s={d.screens.inner}
            classe="face-inner"
            ox={cote === "r" ? -op.w / 2 : undefined}
          >
            <div className="crease" />
          </Plaque>
        </div>
      ))}
      <Plaque body={d.body.closed} s={d.screens.cover} classe="cover">
        <div className="punch" />
      </Plaque>
    </div>
  );
}

/** Les cotes : largeur, hauteur, diagonale, surface. */
function Reperes({
  boite,
  marks,
  f,
}: {
  boite: Disposition["boites"][number];
  marks: { w: boolean; h: boolean; d: boolean; a: boolean };
  f: Formats;
}) {
  const { s, body } = boite;
  const actives = (Object.entries(marks) as [keyof typeof marks, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => " m-" + k)
    .join("");

  return (
    <div
      className={"marks" + actives}
      style={vars({
        "--mx": (body.w - s.w) / 2,
        "--my": (body.h - s.h) / 2,
        "--mw": s.w,
        "--mh": s.h,
        "--stag": boite.stag,
        "--woff": boite.woff.toFixed(2),
        "--hoff": boite.hoff.toFixed(2),
      })}
    >
      <div className="mk mk-w">
        <span className="tag">{`${f.f1(s.w)} mm`}</span>
      </div>
      <div className="mk mk-h">
        <span className="tag">{`${f.f1(s.h)} mm`}</span>
      </div>
      <div className="mk mk-d">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="0" x2="100" y2="100" />
        </svg>
        <span className="tag">{f.dg(s.diag)}</span>
      </div>
      <div className="mk mk-a">
        <span className="tag">{`${f.f1(s.area)} cm²`}</span>
      </div>
    </div>
  );
}

export function Banc({
  dispo,
  mode,
  etat,
  marks,
  focus,
  f,
  surSurvol,
  surSortie,
  refDefilement,
  dict,
}: {
  dispo: Disposition;
  mode: Mode;
  etat: EtatPli;
  marks: { w: boolean; h: boolean; d: boolean; a: boolean };
  focus: string | null;
  f: Formats;
  surSurvol(id: string): void;
  surSortie(): void;
  refDefilement: React.Ref<HTMLDivElement>;
  dict: Dictionnaire;
}) {
  void dict;
  return (
    <div className="stage-scroll" ref={refDefilement}>
      <div
        className="stage"
        data-mode={mode}
        style={{ width: `calc(${dispo.canvasMm} * var(--u))` }}
      >
        {dispo.boites.map((b) => {
          const d = b.d;
          // la taille du cadre ne bouge pas avec le pli : c'est l'encombrement maximal
          const cadre = d.kind === "bar" ? d.body.closed : d.body.open;
          const enAvant = focus === d.id || (dispo.seulVisible && b.visible);
          return (
            <div
              key={d.id}
              className={"dev" + (enAvant ? " focus" : "")}
              style={{
                ...vars({
                  "--dc": teinte(d.id),
                  "--x": `calc(${b.x} * var(--u))`,
                  "--y": `calc(${b.y} * var(--u))`,
                }),
                zIndex: b.z,
                width: `calc(${cadre.w} * var(--u))`,
                height: `calc(${cadre.h} * var(--u))`,
                opacity: b.visible ? undefined : 0,
                pointerEvents: b.visible ? undefined : "none",
              }}
              onPointerEnter={() => surSurvol(d.id)}
              onPointerLeave={surSortie}
            >
              <Chassis d={d} ouvert={etat === "open"} />
              <Reperes boite={b} marks={marks} f={f} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
