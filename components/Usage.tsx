import type { Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import { classeAndroid } from "@/lib/geometrie";
import {
  bod,
  etatDe,
  teinte,
  type Catalogue,
  type EtatPli,
  type Locale,
  type Panneau,
} from "@/lib/types";

import type { CleScene } from "./etat";
import { Maquette, metriqueScene } from "./maquettes";
import { Plaque, Riche, vars } from "./primitives";

/**
 * La meme interface rendue dans chaque ecran, a sa taille physique reelle. Une
 * barre est toujours la ; un pliable ne montre que la dalle correspondant a
 * l'etat choisi pour cette section, sans quoi on comparerait deux fois le meme
 * appareil.
 */
export function RangeeScenes({
  panneaux,
  etatScene,
  scene,
  cat,
  dict,
  f,
  locale,
  refBoite,
}: {
  panneaux: Panneau[];
  etatScene: EtatPli;
  scene: CleScene;
  cat: Catalogue;
  dict: Dictionnaire;
  f: Formats;
  locale: Locale;
  refBoite: React.Ref<HTMLDivElement>;
}) {
  const liste = panneaux.filter(
    (p) => p.d.kind === "bar" || (p.k === "inner") === (etatScene === "open"),
  );
  const nomRef = cat.parId[cat.refId]!.name;

  return (
    <div className="scenes" ref={refBoite}>
      <div className="scene-row">
        {liste.length === 0 ? (
          <Riche tag="div" className="empty" html={dict.vide} />
        ) : (
          liste.map((p) => {
            const st = etatDe(p.k);
            const body = bod(p.d, st);
            const [m1, m2] = metriqueScene(scene, p.s, cat.ref, nomRef, dict, f);
            const classe = classeAndroid(p.s.dpW);
            const nom =
              p.d.kind === "bar"
                ? p.d.name
                : `${p.d.name} · ${p.k === "inner" ? dict.usage.ouvert : dict.usage.ferme}`;

            return (
              <div className="scene-col" key={`${p.d.id}:${p.k}`}>
                <div
                  className="dev"
                  style={{
                    ...vars({ "--dc": teinte(p.d.id), "--u": "var(--u2)" }),
                    position: "relative",
                    width: `calc(${body.w} * var(--u2))`,
                    height: `calc(${body.h} * var(--u2))`,
                  }}
                >
                  <Plaque body={body} s={p.s}>
                    <Maquette scene={scene} s={p.s} dict={dict} f={f} locale={locale} />
                    {p.k === "inner" && <div className="crease" />}
                  </Plaque>
                </div>
                <div className="scene-cap">
                  <span className="n">{nom}</span>
                  <span className="m">{m1}</span>
                  <span className="s">{m2}</span>
                  <span className={"wsc" + (classe === "expanded" ? " exp" : "")}>
                    {dict.classes[classe]}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
