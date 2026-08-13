"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { contexte, dictionnaire } from "@/i18n";
import { formats } from "@/lib/format";
import { disposer, echelleAuto, echelleScenes } from "@/lib/scene";
import {
  REPERES,
  panneauxDe,
  teinte,
  type Catalogue,
  type Locale,
  type Panneau,
} from "@/lib/types";

import { Barres } from "./Barres";
import { Bandeau, Fiche } from "./Fiche";
import { Banc } from "./Scene";
import { Tableau } from "./Tableau";
import { RangeeScenes } from "./Usage";
import { CLES_SCENE, TEMPS, etatInitial, type EtatUI } from "./etat";
import { Riche, vars } from "./primitives";

/**
 * L'echelle est le seul reglage retenu d'une visite a l'autre : c'est celui que
 * l'utilisateur calibre a la main sur une vraie carte bancaire, le reperdre a
 * chaque chargement serait penible. localStorage peut lever -- navigation
 * privee, iframe bac a sable, stockage plein -- donc tout passe par un
 * try/catch et la page se comporte exactement comme avant s'il est indisponible.
 */
const CLE_ECHELLE = "ecrans-echelle:ppmm";

const lireEchelle = (min: number, max: number): number | null => {
  try {
    const v = parseFloat(localStorage.getItem(CLE_ECHELLE) ?? "");
    return Number.isFinite(v) && v >= min && v <= max ? v : null;
  } catch {
    return null;
  }
};
const ecrireEchelle = (v: number) => {
  try {
    localStorage.setItem(CLE_ECHELLE, String(v));
  } catch {
    /* stockage indisponible : le reglage vaut pour la session, sans plus */
  }
};
const oublierEchelle = () => {
  try {
    localStorage.removeItem(CLE_ECHELLE);
  } catch {
    /* rien a oublier */
  }
};

export function Comparateur({ cat, locale }: { cat: Catalogue; locale: Locale }) {
  const dict = useMemo(() => dictionnaire(locale), [locale]);
  const f = useMemo(() => formats(locale), [locale]);
  const ctx = useMemo(() => contexte(cat, locale), [cat, locale]);

  const [s, setS] = useState<EtatUI>(() => etatInitial(cat));
  const maj = useCallback((p: Partial<EtatUI>) => setS((x) => ({ ...x, ...p })), []);

  const { echelleParDefaut, echelleMin, echelleMax } = cat.reglages;
  const [ppmm, setPpmm] = useState(echelleParDefaut);
  const [ppmm2, setPpmm2] = useState(2.4);
  const [largeurBanc, setLargeurBanc] = useState<number | null>(null);

  const refBanc = useRef<HTMLDivElement>(null);
  const refScenes = useRef<HTMLDivElement>(null);

  /* -- echelles ---------------------------------------------------- */
  // Les deux echelles vivent dans des variables CSS globales : tout le systeme de
  // coordonnees en millimetres en depend, y compris les maquettes d'interface.
  useEffect(() => {
    document.documentElement.style.setProperty("--ppmm", String(ppmm));
  }, [ppmm]);
  useEffect(() => {
    document.documentElement.style.setProperty("--ppmm2", String(ppmm2));
  }, [ppmm2]);

  const base = useMemo(
    () => cat.appareils.filter((d) => cat.reglages.selectionParDefaut.includes(d.id)),
    [cat],
  );

  const recalculerBanc = useCallback(() => {
    const el = refBanc.current;
    if (!el) return;
    // une echelle memorisee fait foi : ni le redimensionnement, ni le repli de la
    // fiche ne doivent ecraser un reglage que l'utilisateur a pose lui-meme
    if (lireEchelle(echelleMin, echelleMax) !== null) return;
    setPpmm(
      echelleAuto({
        base,
        hauteurFenetre: window.innerHeight,
        largeurScene: el.clientWidth,
        plafond: echelleParDefaut,
      }),
    );
  }, [base, echelleMin, echelleMax, echelleParDefaut]);

  const recalculerScenes = useCallback(() => {
    const el = refScenes.current;
    if (!el) return;
    setPpmm2(
      echelleScenes({ base, hauteurFenetre: window.innerHeight, largeurBoite: el.clientWidth }),
    );
  }, [base]);

  // Au chargement : un reglage memorise l'emporte, sinon on calcule.
  useEffect(() => {
    const garde = lireEchelle(echelleMin, echelleMax);
    if (garde !== null) setPpmm(garde);
    else recalculerBanc();
    recalculerScenes();
  }, [echelleMin, echelleMax, recalculerBanc, recalculerScenes]);

  // La largeur disponible change au redimensionnement comme au repli de la fiche :
  // un observateur sur le conteneur couvre les deux cas sans code special.
  useEffect(() => {
    const el = refBanc.current;
    if (!el) return;
    setLargeurBanc(el.clientWidth);
    const ro = new ResizeObserver((entrees) => {
      const w = entrees[0]?.contentRect.width;
      if (w) setLargeurBanc(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (largeurBanc !== null) recalculerBanc();
  }, [largeurBanc, recalculerBanc]);

  // la hauteur de fenetre entre aussi dans les deux echelles, et elle n'est pas
  // observee par le ResizeObserver du conteneur
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const surRedim = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        recalculerBanc();
        recalculerScenes();
      }, 140);
    };
    window.addEventListener("resize", surRedim);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", surRedim);
    };
  }, [recalculerBanc, recalculerScenes]);

  /* -- animation ---------------------------------------------------- */
  const [temps, setTemps] = useState<number | null>(null);
  const [montre, setMontre] = useState(true);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const legendes = useMemo(() => dict.banc.etapes(ctx), [dict, ctx]);

  const arreter = useCallback(() => {
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current = [];
    setTemps(null);
    setMontre(true);
  }, []);

  useEffect(() => () => minuteurs.current.forEach(clearTimeout), []);

  const jouer = useCallback(() => {
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current = [];

    // Mouvement reduit : on saute directement a l'etat final, sans narration.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setS((x) => TEMPS.reduce((acc, t) => t.appliquer(acc, cat), x));
      setTemps(TEMPS.length - 1);
      setMontre(true);
      return;
    }

    let cumul = 0;
    TEMPS.forEach((t, i) => {
      minuteurs.current.push(
        setTimeout(() => {
          setS((x) => t.appliquer(x, cat));
          setTemps(i);
          setMontre(false);
          requestAnimationFrame(() => setMontre(true));
        }, cumul),
      );
      cumul += t.t + (i === 0 ? 350 : 0);
    });
  }, [cat]);

  /** Toute action de l'utilisateur interrompt la narration en cours. */
  const agir = useCallback(
    (p: Partial<EtatUI>) => {
      arreter();
      maj(p);
    },
    [arreter, maj],
  );

  /* -- derivations -------------------------------------------------- */
  const panneaux: Panneau[] = useMemo(
    () => cat.appareils.filter((d) => s.vis[d.id]).flatMap(panneauxDe),
    [cat, s.vis],
  );

  const dispo = useMemo(
    () =>
      disposer({
        appareils: cat.appareils,
        visibles: s.vis,
        mode: s.mode,
        etat: s.etat,
        ppmm,
        largeurPx: largeurBanc,
      }),
    [cat, s.vis, s.mode, s.etat, ppmm, largeurBanc],
  );

  const affiche = cat.parId[s.focus ?? s.sel] ?? cat.parId[cat.reglages.ficheParDefaut]!;

  const changerEchelle = (v: number) => {
    setPpmm(v);
    ecrireEchelle(v);
  };

  const puce = (actif: boolean, extra = "") =>
    "chip" + (actif ? " act" : "") + (extra ? " " + extra : "");

  return (
    <>
      {/* -- 01 : le banc de mesure -- */}
      <section className="sec" id="banc">
        <div className="wrap bleed">
          <div className="sec-head">
            <span className="eyebrow">{dict.banc.eyebrow}</span>
            <h2>{dict.banc.titre}</h2>
            <p>{dict.banc.intro}</p>
          </div>

          <div className="ctl-bar">
            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.appareils}</span>
              <div className="chips">
                {cat.appareils.map((d) => (
                  <button
                    key={d.id}
                    className={"chip" + (s.vis[d.id] ? "" : " off")}
                    aria-pressed={!!s.vis[d.id]}
                    style={vars({ "--dc": teinte(d.id) })}
                    onClick={() =>
                      agir({
                        vis: { ...s.vis, [d.id]: !s.vis[d.id] },
                        ...(s.vis[d.id] ? {} : { sel: d.id }),
                      })
                    }
                    onPointerEnter={() => maj({ focus: d.id })}
                    onPointerLeave={() => maj({ focus: null })}
                  >
                    <span className="sw" />
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.disposition}</span>
              <div className="chips">
                {(["side", "stack", "center"] as const).map((m) => (
                  <button
                    key={m}
                    className={puce(s.mode === m)}
                    onClick={() => agir({ mode: m })}
                  >
                    {dict.ctl.modes[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.ecranPliables}</span>
              <div className="chips">
                {(["closed", "open"] as const).map((e) => (
                  <button
                    key={e}
                    className={puce(s.etat === e)}
                    onClick={() => agir({ etat: e })}
                  >
                    {dict.ctl.etats[e]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.reperes}</span>
              <div className="chips">
                {REPERES.map((k) => (
                  <button
                    key={k}
                    className={puce(s.marks[k], "ghost")}
                    aria-pressed={s.marks[k]}
                    onClick={() => maj({ marks: { ...s.marks, [k]: !s.marks[k] } })}
                  >
                    {dict.ctl.marques[k]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.animation}</span>
              <div className="chips">
                <button className="chip act" onClick={jouer}>
                  {dict.ctl.rejouer}
                </button>
              </div>
            </div>

            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.ficheTechnique}</span>
              <div className="chips">
                <button
                  className={puce(!s.fiche)}
                  aria-expanded={s.fiche}
                  aria-controls="fiche"
                  onClick={() => maj({ fiche: !s.fiche })}
                >
                  {s.fiche ? dict.ctl.replierFiche : dict.ctl.deplierFiche}
                </button>
              </div>
            </div>
          </div>

          <div className={"stage-grid" + (s.fiche ? "" : " solo")}>
            <div>
              <div className="stage-shell">
                <Banc
                  dispo={dispo}
                  mode={s.mode}
                  etat={s.etat}
                  marks={s.marks}
                  focus={s.focus}
                  f={f}
                  dict={dict}
                  refDefilement={refBanc}
                  surSurvol={(id) => maj({ focus: id, sel: id })}
                  surSortie={() => maj({ focus: null })}
                />

                <div className="narrate">
                  <div className="step-dots">
                    {TEMPS.map((_, i) => (
                      <span
                        key={i}
                        className={"sd" + (temps !== null && i <= temps ? " on" : "")}
                      />
                    ))}
                  </div>
                  <Riche
                    className={"cap" + (montre ? " show" : "")}
                    tag="div"
                    html={temps === null ? dict.banc.exploration : (legendes[temps]?.cap ?? "")}
                  />
                </div>

                {!s.fiche && (
                  <Bandeau
                    d={affiche}
                    etat={s.etat}
                    cat={cat}
                    dict={dict}
                    f={f}
                    locale={locale}
                  />
                )}

                <div className="stage-foot">
                  <div className="calib">
                    <label htmlFor="cal">{dict.banc.echelle}</label>
                    <input
                      type="range"
                      id="cal"
                      min={echelleMin}
                      max={echelleMax}
                      step={0.05}
                      value={ppmm}
                      aria-describedby="calHint"
                      onChange={(e) => changerEchelle(parseFloat(e.target.value))}
                    />
                    <span className="num">{dict.banc.unite(f.f2(ppmm))}</span>
                    <button
                      className="chip ghost"
                      style={{ padding: "5px 10px", fontSize: 12 }}
                      onClick={() => {
                        // oublier avant de recalculer : dans l'autre ordre, le
                        // garde-fou de recalculerBanc renverrait la valeur memorisee
                        oublierEchelle();
                        recalculerBanc();
                      }}
                    >
                      {dict.banc.reinitialiser}
                    </button>
                  </div>
                  {dispo.defile && (
                    <span className="scrollhint">{dict.banc.indiceDefilement}</span>
                  )}
                  <Riche tag="div" className="card-ref" html={dict.banc.carte} />
                </div>
              </div>
              <p className="mut" id="calHint" style={{ fontSize: 12.5, marginTop: 10 }}>
                {dict.banc.aideCalibration}
              </p>
            </div>

            {s.fiche && (
              <Fiche
                d={affiche}
                etat={s.etat}
                cat={cat}
                dict={dict}
                f={f}
                locale={locale}
                surRepli={() => maj({ fiche: false })}
              />
            )}
          </div>
        </div>
      </section>

      {/* -- 02 : surface d'affichage -- */}
      <section className="sec" id="surface">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">{dict.surface.eyebrow}</span>
            <h2>{dict.surface.titre}</h2>
            <p>{dict.surface.intro(cat.tousPanneaux.length)}</p>
          </div>
          <Barres
            panneaux={panneaux}
            cat={cat}
            ctx={ctx}
            dict={dict}
            f={f}
            locale={locale}
          />
          <div className="claims">
            {dict.surface.affirmations(ctx).map((a, i) => (
              <Riche
                key={i}
                tag="div"
                className="claim"
                style={vars({ "--dc": a.deviceId ? teinte(a.deviceId) : "var(--acc)" })}
                html={a.texte}
              />
            ))}
          </div>
        </div>
      </section>

      {/* -- 03 : mise en situation -- */}
      <section className="sec" id="usage">
        <div className="wrap bleed">
          <div className="sec-head">
            <span className="eyebrow">{dict.usage.eyebrow}</span>
            <h2>{dict.usage.titre}</h2>
            <Riche tag="p" html={dict.usage.intro} />
          </div>
          <div className="ctl-bar">
            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.contenu}</span>
              <div className="chips">
                {CLES_SCENE.map((k) => (
                  <button
                    key={k}
                    className={puce(s.scene === k)}
                    onClick={() => maj({ scene: k })}
                  >
                    {dict.usage.scenes[k].nom}
                  </button>
                ))}
              </div>
            </div>
            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.pliables}</span>
              <div className="chips">
                {(["closed", "open"] as const).map((e) => (
                  <button
                    key={e}
                    className={puce(s.etatScene === e)}
                    onClick={() => maj({ etatScene: e })}
                  >
                    {dict.ctl.etatsCourts[e]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <RangeeScenes
            panneaux={panneaux}
            etatScene={s.etatScene}
            scene={s.scene}
            cat={cat}
            dict={dict}
            f={f}
            locale={locale}
            refBoite={refScenes}
          />
          <p className="mut" style={{ fontSize: 12.5, marginTop: 12 }}>
            {dict.usage.scenes[s.scene].note}
          </p>
        </div>
      </section>

      {/* -- 04 : releve complet -- */}
      <section className="sec" id="fiches">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">{dict.tableau.eyebrow}</span>
            <h2>{dict.tableau.titre(panneaux.length)}</h2>
            <Riche tag="p" html={dict.tableau.intro} />
          </div>
          <div className="tbl-scroll">
            <Tableau
              panneaux={panneaux}
              cat={cat}
              ctx={ctx}
              dict={dict}
              f={f}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </>
  );
}
