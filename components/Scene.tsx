import type { Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import { HAUTEUR_MM, type Disposition, type Mode } from "@/lib/scene";
import { teinte, type Appareil, type AppareilPliable, type Marques } from "@/lib/types";

import { Plaque, vars } from "./primitives";

/**
 * Un appareil sur le banc de mesure. Une barre est une simple plaque ; un
 * pliable est deux volets dont le droit pivote sur sa charniere, avec la plaque
 * de couverture qui s'efface en fondu.
 *
 * Aucune classe d'etat ici : tout le geste est fonction de `--pli`, un nombre
 * herite de la scene. Toute la mecanique est en CSS.
 */
function Chassis({ d }: { d: Appareil }) {
  if (d.kind === "bar") {
    return (
      <Plaque body={d.body.closed} s={d.screens.main}>
        <div className="punch" />
      </Plaque>
    );
  }
  const op = d.body.open;
  return (
    <div className="fold" style={vars({ "--ow": op.w, "--oh": op.h, "--hw": op.w / 2 })}>
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
  marks: Marques;
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

/**
 * Un pliable vu par la tranche : deux volets et une pliure. Le volet gauche
 * reste pose au sol, le droit pivote de 180 degres autour de la charniere --
 * c'est le meme partage que `Chassis` fait en vue de face, donc les deux vues
 * plient dans le meme geste.
 *
 * Les quatre variables sont intrinseques a l'appareil, pas a la disposition :
 * c'est pourquoi elles se calculent ici et non dans `disposer()`.
 *
 *  --eh  demi-largeur depliee : l'abscisse de la pliure
 *  --eo  epaisseur depliee : celle d'un volet
 *  --ec  epaisseur repliee **publiee**, dont le CSS deduit la hauteur du pivot
 *  --eb  debord du dos : ce que la largeur repliee a de plus que la demi-largeur
 *
 * Les deux dernieres sont ce qui rend la bande juste au millimetre dans les deux
 * etats plutot que seulement vraisemblable. Voir le bloc CSS de `.pli`.
 */
function Pliure({ d }: { d: AppareilPliable }) {
  const op = d.body.open;
  const cl = d.body.closed;
  return (
    <div
      className="pli"
      style={vars({
        "--eh": op.w / 2,
        "--eo": op.d,
        "--ec": cl.d,
        "--eb": +(cl.w - op.w / 2).toFixed(2),
      })}
    >
      <div className="sect vol l" />
      <div className="sect vol r" />
    </div>
  );
}

/**
 * Les appareils vus par la tranche, sous la scene et a la meme echelle : chaque
 * profil fait `body.w` de large sur `body.d` d'epais, pose a la meme abscisse
 * que l'appareil au-dessus de lui.
 *
 * `.prof` est la **cote** : sa boite vaut exactement `bod(d, etat)`, elle porte
 * l'etiquette en mm et c'est elle qui se deplace. Ce qui peint, ce sont les
 * sections a l'interieur -- une seule pour une barre, deux volets articules pour
 * un pliable. La cote reste donc mesurable pendant que le dessin, lui, plie.
 *
 * La bande partage la largeur et le defilement de la scene, et reprend son
 * `data-mode` : en superposition les profils se recouvrent exactement comme les
 * dalles, poses sur une ligne de base commune.
 */
function Tranche({
  dispo,
  mode,
  intermediaire,
  focus,
  f,
  etiquette,
  surSurvol,
  surSortie,
}: {
  dispo: Disposition;
  mode: Mode;
  intermediaire: boolean;
  focus: string | null;
  f: Formats;
  etiquette: string;
  surSurvol(id: string): void;
  surSortie(): void;
}) {
  return (
    <div
      className="tranche quadrille"
      data-mode={mode}
      role="img"
      aria-label={etiquette}
      style={{
        width: `calc(${dispo.canvasMm} * var(--u))`,
        ...vars({ "--epmax": dispo.epaisseurMaxMm }),
      }}
    >
      {dispo.boites.map((b) => {
        const enAvant = focus === b.d.id || (dispo.seulVisible && b.visible);
        return (
          <div
            key={b.d.id}
            className={
              "prof" +
              (enAvant ? " focus" : "") +
              // entre les deux etats publies, l'epaisseur d'un pliable n'a pas de
              // valeur : sa cote s'efface plutot que d'en afficher une fausse
              (intermediaire && b.d.kind === "fold" ? " sans-cote" : "")
            }
            style={{
              ...vars({
                "--dc": teinte(b.d.id),
                "--ex": b.x,
                "--ew": b.body.w,
                "--ed": b.body.d,
                "--stag": b.stag,
                // le rang de profondeur va aux sections, pas au profil : c'est ce qui
                // laisse l'etiquette passer sous *toutes* les sections de la bande et
                // pas seulement sous celles de son propre appareil
                "--z": b.z,
              }),
              opacity: b.visible ? undefined : 0,
              pointerEvents: b.visible ? undefined : "none",
            }}
            onPointerEnter={() => surSurvol(b.d.id)}
            onPointerLeave={surSortie}
          >
            {b.d.kind === "fold" ? (
              <Pliure d={b.d} />
            ) : (
              <div className="sect plein" />
            )}
            <span className="tag">{f.mm(b.body.d)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Banc({
  dispo,
  mode,
  pli,
  libre,
  intermediaire,
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
  /**
   * L'ouverture **dessinee**, de 0 a 1. Elle n'est pas l'etat que voit `dispo` :
   * le pliage est sequence (la charniere et la disposition ne bougent pas
   * ensemble, voir `useRetarde`), et le curseur peut la poser entre les deux.
   * Tout le geste, dans les deux vues, est fonction de ce seul nombre.
   */
  pli: number;
  /** l'ouverture vient du curseur : elle suit la main, sans transition */
  libre: boolean;
  /**
   * Entre les deux etats publies. Les cotes d'un pliable qui sont dessinees *sur*
   * sa dalle -- diagonale, surface, et l'epaisseur dans la bande -- s'effacent
   * alors ; ses rails de largeur et de hauteur restent, ils marquent
   * l'encombrement deplie que la disposition reserve. Voir `.sans-cote`.
   */
  intermediaire: boolean;
  marks: Marques;
  focus: string | null;
  f: Formats;
  surSurvol(id: string): void;
  surSortie(): void;
  refDefilement: React.Ref<HTMLDivElement>;
  dict: Dictionnaire;
}) {
  return (
    <div
      className="stage-scroll"
      ref={refDefilement}
      /* --pli est pose ici, ancetre commun des deux vues : la bande de tranche est
         soeur de la scene et n'heriterait de rien s'il vivait sur celle-ci.
         data-libre coupe sa transition le temps que le curseur soit tenu. */
      data-libre={libre ? "" : undefined}
      style={vars({ "--pli": pli })}
    >
      <div
        className="stage quadrille"
        data-mode={mode}
        // la hauteur vient de lib/scene.ts, qui la fait deja entrer dans le
        // budget d'echelle : la redire en CSS, c'est la laisser diverger
        style={{
          width: `calc(${dispo.canvasMm} * var(--u))`,
          height: `calc(${HAUTEUR_MM} * var(--u))`,
        }}
      >
        {dispo.boites.map((b) => {
          const d = b.d;
          // la taille du cadre ne bouge pas avec le pli : c'est l'encombrement maximal
          const cadre = d.kind === "bar" ? d.body.closed : d.body.open;
          const enAvant = focus === d.id || (dispo.seulVisible && b.visible);
          return (
            <div
              key={d.id}
              className={
                "dev" +
                (enAvant ? " focus" : "") +
                // n'eteint que la diagonale et la surface : elles sont posees sur
                // une dalle qui, a mi-course, est en partie retournee
                (intermediaire && d.kind === "fold" ? " sans-cote" : "")
              }
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
              <Chassis d={d} />
              <Reperes boite={b} marks={marks} f={f} />
            </div>
          );
        })}
      </div>

      {marks.e && (
        <Tranche
          dispo={dispo}
          mode={mode}
          intermediaire={intermediaire}
          focus={focus}
          f={f}
          etiquette={dict.banc.tranche}
          surSurvol={surSurvol}
          surSortie={surSortie}
        />
      )}
    </div>
  );
}
