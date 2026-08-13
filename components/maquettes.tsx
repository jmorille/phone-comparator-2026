import type { Dictionnaire } from "@/i18n";
import type { Formats } from "@/lib/format";
import { cadreVideoPortrait, surfaceVideo } from "@/lib/geometrie";
import type { Ecran } from "@/lib/types";

import type { CleScene } from "./etat";

/*
 * Les maquettes sont dessinees en dp Android reels : 1 dp = 0,15875 mm, converti
 * par --dp2. C'est tout l'objet de la section -- a taille physique constante, un
 * plus grand ecran ne grossit pas l'interface, il en montre davantage. Les
 * largeurs pseudo-aleatoires sont derivees de l'index pour rester stables entre
 * le rendu serveur et le rendu client.
 */

const Ligne = ({ largeur, faible }: { largeur?: string; faible?: boolean }) => (
  <div className="ln" style={{ width: largeur, opacity: faible ? 0.12 : undefined }} />
);

const RangeeListe = ({ i, fixe }: { i: number; fixe?: boolean }) => (
  <div className="ui-row">
    <div className="ui-av" />
    <div className="ui-rl">
      <Ligne largeur={fixe ? "70%" : `${45 + ((i * 17) % 40)}%`} />
      <Ligne largeur={fixe ? "90%" : `${62 + ((i * 23) % 30)}%`} faible />
    </div>
  </div>
);

function PageWeb({ s, dict, locale }: { s: Ecran; dict: Dictionnaire; locale: string }) {
  void locale;
  const combien = Math.ceil(s.dpH / 24) + 4;
  return (
    <div className="ui light">
      <div className="ui-col">
        <div className="ui-bar">
          <span className="ui-k">{dict.usage.ui.actualite}</span>
          <div className="ln" style={{ flex: 1, margin: 0 }} />
        </div>
        <div className="ui-body">
          <div className="ui-t">{dict.usage.ui.titreArticle}</div>
          <div className="ln" style={{ marginTop: "calc(14 * var(--dp2))", width: "70%" }} />
          <div className="ui-img" />
          {Array.from({ length: combien }, (_, i) => (
            <Ligne key={i} largeur={i % 7 === 6 ? `${48 + ((i * 13) % 22)}%` : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Video({ s, f }: { s: Ecran; f: Formats }) {
  const cadre = cadreVideoPortrait(s);
  return (
    <div className="ui">
      <div className="ui-vid">
        <div
          className="ui-frame"
          style={{
            width: `calc(${cadre.w} * var(--u))`,
            height: `calc(${cadre.h} * var(--u))`,
          }}
        />
      </div>
      <div className="pane-tag">{`${f.f1(cadre.w)} × ${f.f1(cadre.h)} mm`}</div>
    </div>
  );
}

function Liste({ s, dict }: { s: Ecran; dict: Dictionnaire }) {
  const rangees = Math.max(1, Math.floor((s.dpH - 56) / 72) + 1);
  return (
    <div className="ui">
      <div className="ui-col">
        <div className="ui-bar">
          <span className="ui-k">{dict.usage.ui.boiteReception}</span>
        </div>
        <div className="ui-body" style={{ paddingTop: "calc(6 * var(--dp2))" }}>
          {Array.from({ length: rangees }, (_, i) => (
            <RangeeListe key={i} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Multitache({ s, dict }: { s: Ecran; dict: Dictionnaire }) {
  // Android bascule cote a cote des que la dalle s'approche du carre
  const cote = s.dpW / s.dpH > 0.8;
  return (
    <div className={"ui-split" + (cote ? "" : " stack")}>
      <div className="ui-pane">
        <div className="ui light" style={{ background: "#F7F8FB" }}>
          <div className="ui-col">
            <div className="ui-bar">
              <span className="ui-k">{dict.usage.ui.messages}</span>
            </div>
            <div className="ui-body">
              {Array.from({ length: 16 }, (_, i) => (
                <RangeeListe key={i} i={i} fixe />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="ui-pane">
        <div className="ui">
          <div className="ui-col">
            <div className="ui-bar">
              <span className="ui-k">{dict.usage.ui.article}</span>
            </div>
            <div className="ui-body">
              <div className="ui-t" style={{ fontSize: "calc(20 * var(--dp2))" }}>
                {dict.usage.ui.titreArticleCourt}
              </div>
              <div className="ui-img" style={{ height: "calc(90 * var(--dp2))" }} />
              {Array.from({ length: 26 }, (_, i) => (
                <Ligne key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Maquette({
  scene,
  s,
  dict,
  f,
  locale,
}: {
  scene: CleScene;
  s: Ecran;
  dict: Dictionnaire;
  f: Formats;
  locale: string;
}) {
  switch (scene) {
    case "web":
      return <PageWeb s={s} dict={dict} locale={locale} />;
    case "video":
      return <Video s={s} f={f} />;
    case "list":
      return <Liste s={s} dict={dict} />;
    case "multi":
      return <Multitache s={s} dict={dict} />;
  }
}

/**
 * Les deux lignes de legende sous chaque appareil. Le calcul est ici, la
 * formulation dans le dictionnaire : c'est la seule facon de traduire sans
 * dupliquer les modeles d'estimation.
 */
export function metriqueScene(
  scene: CleScene,
  s: Ecran,
  ref: Ecran,
  nomRef: string,
  dict: Dictionnaire,
  f: Formats,
): [string, string] {
  const m = dict.usage.metriques;
  switch (scene) {
    case "web": {
      const lignes = Math.max(0, Math.floor((s.dpH - 96) / 24));
      // le total part de la largeur exacte ; seule la valeur affichee « par ligne »
      // est arrondie, sans quoi l'arrondi se multiplierait par le nombre de lignes
      const parLigne = s.dpW / 8.2;
      return [m.caracteres(f.f0(lignes * parLigne)), m.lignes(lignes, Math.round(parLigne))];
    }
    case "video": {
      const aire = surfaceVideo(s);
      const aireRef = surfaceVideo(ref);
      const relatif =
        Math.abs(aire - aireRef) < 0.05
          ? m.reference
          : m.versRef(f.pc((aire / aireRef - 1) * 100), nomRef);
      return [m.image(f.f1(aire)), m.partDalle(Math.round((aire / s.area) * 100), relatif)];
    }
    case "list": {
      const rangees = Math.max(0, Math.floor((s.dpH - 56) / 72));
      return [m.elements(rangees), m.hauteurDp(f.f0(s.dpH))];
    }
    case "multi": {
      const cote = s.dpW / s.dpH > 0.8;
      const l = cote ? s.dpW / 2 : s.dpW;
      const h = cote ? s.dpH : s.dpH / 2;
      return [m.volets(f.f0(l), f.f0(h)), cote ? m.voletsCote : m.voletsEmpiles];
    }
  }
}
