"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { contexte, dictionnaire, nomDalle } from "@/i18n";
import { formats } from "@/lib/format";
import { disposer, echelleAuto, echelleScenes } from "@/lib/scene";
import {
  REPERES,
  cleDe,
  memeDalle,
  panneauxDe,
  resoudreRef,
  teinte,
  type Catalogue,
  type EtatPli,
  type Locale,
  type Panneau,
} from "@/lib/types";

import { Barres } from "./Barres";
import { Bandeau, Fiche } from "./Fiche";
import { Banc } from "./Scene";
import { Tableau } from "./Tableau";
import { RangeeScenes } from "./Usage";
import { Verdicts } from "./Verdicts";
import {
  CHARNIERE_MS,
  CLES_SCENE,
  DISPOSITION_MS,
  TEMPS,
  etatInitial,
  type EtatUI,
} from "./etat";
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

/**
 * `etat`, mais en retard de `ms` lorsqu'il passe a `sens` -- immediat dans l'autre
 * sens. C'est toute la mecanique du sequencage du pliage : deux lectures decalees
 * du meme etat, l'une pour la disposition, l'autre pour les volets.
 *
 * Mouvement reduit : le retard tombe a zero. Etaler un geste dont toutes les
 * transitions sont instantanees ne donnerait pas un mouvement adouci, mais un
 * ecran qui se fige une seconde et demie entre deux sauts.
 */
function useRetarde(etat: EtatPli, sens: EtatPli, ms: number): EtatPli {
  const [vu, setVu] = useState(etat);
  useEffect(() => {
    if (etat === vu) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (etat !== sens || reduit) {
      setVu(etat);
      return;
    }
    const t = setTimeout(() => setVu(etat), ms);
    return () => clearTimeout(t);
  }, [etat, vu, sens, ms]);
  return vu;
}

export function Comparateur({ cat, locale }: { cat: Catalogue; locale: Locale }) {
  const dict = useMemo(() => dictionnaire(locale), [locale]);
  const f = useMemo(() => formats(locale), [locale]);

  const [s, setS] = useState<EtatUI>(() => etatInitial(cat));
  const maj = useCallback((p: Partial<EtatUI>) => setS((x) => ({ ...x, ...p })), []);

  /*
   * La dalle de reference, et le contexte qu'elle determine. Tout ce qui affiche
   * un pourcentage en depend -- les barres, le tableau, la fiche, les mises en
   * situation et les verdicts -- donc les deux se calculent ici, une fois, et
   * descendent en props.
   *
   * resoudreRef() garantit que la dalle rendue est cochee : le choix ne survit
   * pas au decochage de son appareil, sinon la page comparerait a une dalle
   * absente de la scene.
   */
  const dalleRef = useMemo(() => resoudreRef(cat, s.vis, s.ref), [cat, s.vis, s.ref]);
  const ctx = useMemo(() => contexte(cat, locale, dalleRef), [cat, locale, dalleRef]);

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

  /* -- sequencage du pliage ----------------------------------------- */
  /*
   * Un pliable se referme AVANT que la scene se resserre, et la scene s'ecarte
   * AVANT qu'il se deplie. Sans cela on voit les appareils se tasser sur un volet
   * encore en vol, ou un volet se deployer par-dessus son voisin.
   *
   * Ce decalage ne peut pas se deduire de l'etat du pli : la feuille de style
   * verrait « replie » et retarderait *tout* changement de disposition, si bien
   * que cocher un appareil pendant qu'un pliable est ferme resterait suspendu
   * une seconde et demie pour rien. C'est le geste qu'on marque, pas l'etat
   * d'arrivee -- le temps qu'il dure, et lui seul.
   *
   * Le sens du geste est celui de l'etat vers lequel on va : globals.css lit
   * `data-geste` pour donner une valeur a --pause et a --elan.
   */
  /*
   * Deux lectures de l'etat du pli, decalees l'une par rapport a l'autre. Le
   * bouton, lui, ne connait que `s.etat` -- l'intention, immediate.
   *
   *   pliDispo      ce que voit disposer() : positions, largeurs, cotes.
   *                 Il attend la fin de la charniere quand on REFERME, pour que
   *                 les appareils ne se tassent pas sur un volet encore en vol.
   *   pliCharniere  ce que voient les volets. Il attend la disposition quand on
   *                 DEPLIE, pour qu'un volet ne se deploie pas sur son voisin.
   *
   * Le decalage se joue sur l'etat et non sur un `transition-delay` en CSS : un
   * delai arme depuis React arrive toujours trop tard. Mesure faite, la
   * transition de disposition etait deja creee avec un delai nul -- le style
   * calcule affichait bien 1,8 s, mais l'animation en cours, elle, portait 0.
   */
  /*
   * `libre` : le curseur mene. Il reste vrai apres qu'on l'a lache, jusqu'a ce
   * qu'une puce ou la narration reprenne la main -- deux consequences voulues.
   * La transition de --pli reste coupee, donc un second glissement suit le doigt
   * comme le premier ; et le sequencage du pliage s'efface, parce qu'il n'a plus
   * rien a sequencer : l'utilisateur fait lui-meme le timing du geste, la
   * disposition n'a pas a attendre une charniere deja arrivee.
   */
  const libre = s.pliLibre !== null;
  const pliDispo = useRetarde(s.etat, "closed", libre ? 0 : CHARNIERE_MS);
  const pliCharniere = useRetarde(s.etat, "open", libre ? 0 : DISPOSITION_MS);

  /** l'ouverture dessinee : le curseur, ou la charniere sequencee des puces */
  const pli = s.pliLibre ?? (pliCharniere === "open" ? 1 : 0);
  /** entre les deux etats publies : les cotes des pliables n'ont plus de valeur */
  const intermediaire = pli > 0 && pli < 1;

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

  /*
   * Les dalles proposees comme repere : celles en scene, plus la reference
   * courante si elle n'y est pas. Ce second cas n'est pas theorique -- la
   * reference du catalogue reste l'etalon meme decochee (voir resoudreRef), et
   * elle ne fait pas partie de la selection de depart. Sans elle dans la liste,
   * aucune puce ne serait active au chargement alors qu'un repere est bien actif.
   */
  const optionsRef: Panneau[] = useMemo(() => {
    const cle = cleDe(dalleRef);
    return panneaux.some((p) => memeDalle(cleDe(p), cle)) ? panneaux : [dalleRef, ...panneaux];
  }, [panneaux, dalleRef]);

  const dispo = useMemo(
    () =>
      disposer({
        appareils: cat.appareils,
        visibles: s.vis,
        mode: s.mode,
        etat: pliDispo,
        ppmm,
        largeurPx: largeurBanc,
      }),
    [cat, s.vis, s.mode, pliDispo, ppmm, largeurBanc],
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
            <div className="ctl-grp ctl-souple">
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
              <span className="ctl-lbl">{dict.ctl.ecranPliables}</span>
              <div className="chips">
                {(["closed", "open"] as const).map((e) => (
                  <button
                    key={e}
                    // active des que le dessin est a ce bout, quel que soit le
                    // chemin : le curseur pose au fond est un appareil ferme
                    className={puce(pli === (e === "open" ? 1 : 0))}
                    onClick={() => agir({ etat: e, pliLibre: null })}
                  >
                    {dict.ctl.etats[e]}
                  </button>
                ))}
              </div>
              {/*
                Le curseur pose les pliables a l'angle qu'on veut. Aux deux bouts
                il rend la main aux puces (pliLibre repasse a null) : la position
                redevient un etat publie, ses cotes reviennent, et la disposition
                s'y ajuste. Entre les deux, seul le dessin bouge.
              */}
              <div className="calib pli-rng">
                <label htmlFor="pli">{dict.ctl.ouverture}</label>
                <input
                  type="range"
                  id="pli"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pli}
                  aria-valuetext={dict.ctl.ouverturePc(f.f0(pli * 100))}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    /*
                     * L'etat publie bascule des que le curseur quitte le fond, et
                     * non a mi-course : la disposition reserve alors l'encombrement
                     * **deplie**, le seul qui contienne toutes les positions
                     * intermediaires. Sans cela les pliables s'ouvraient dans une
                     * scene restee resserree -- mesure faite, ils debordaient de
                     * 127 a 146 px sur leurs voisins a 90 % d'ouverture.
                     *
                     * pliLibre, lui, reste pose meme aux deux bouts : le lacher
                     * rallumerait la transition et les derniers degres du geste se
                     * joueraient tout seuls apres coup.
                     */
                    agir({ pliLibre: v, etat: v > 0 ? "open" : "closed" });
                  }}
                />
                <span className="num">{dict.ctl.ouverturePc(f.f0(pli * 100))}</span>
              </div>
            </div>

            <div className="ctl-col">
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
            </div>


            <div className="ctl-col">
              <div className="ctl-grp">
                <span className="ctl-lbl">{dict.ctl.animation}</span>
                <div className="chips">
                  {/* icone seule : le libelle porte le nom accessible et l'infobulle */}
                  <button
                    className="chip act ico"
                    onClick={jouer}
                    title={dict.ctl.rejouer}
                    aria-label={dict.ctl.rejouer}
                  >
                    ↻
                  </button>
                </div>
              </div>
              <div className="ctl-grp">
                <span className="ctl-lbl">{dict.ctl.ficheTechnique}</span>
                <div className="chips">
                  <button
                    className={puce(!s.fiche, "ico")}
                    aria-expanded={s.fiche}
                    aria-controls="fiche"
                    title={s.fiche ? dict.ctl.replierFiche : dict.ctl.deplierFiche}
                    aria-label={s.fiche ? dict.ctl.replierFiche : dict.ctl.deplierFiche}
                    onClick={() => maj({ fiche: !s.fiche })}
                  >
                    {s.fiche ? "«" : "»"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={"stage-grid" + (s.fiche ? "" : " solo")}>
            <div>
              <div className="stage-shell">
                <Banc
                  dispo={dispo}
                  mode={s.mode}
                  pli={pli}
                  libre={libre}
                  intermediaire={intermediaire}
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
                    dalleRef={dalleRef}
                    nomRef={ctx.nomRef}
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
                dalleRef={dalleRef}
                nomRef={ctx.nomRef}
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
            <Riche tag="p" html={dict.surface.intro(ctx.nomRef)} />
          </div>

          {/*
            Le choix du 100 %. Il porte sur les *dalles* et non sur les appareils :
            se comparer a l'ecran externe ou a l'ecran interne d'un pliable sont
            deux questions differentes, et la section 02 est justement une liste de
            dalles. La liste suit la selection -- on ne peut pas se comparer a une
            dalle qui n'est pas en scene.
          */}
          <div className="ctl-bar">
            <div className="ctl-grp">
              <span className="ctl-lbl">{dict.ctl.comparerA}</span>
              <div className="chips">
                {optionsRef.map((p) => {
                  const actif = memeDalle(cleDe(p), cleDe(dalleRef));
                  const enScene = !!s.vis[p.d.id];
                  return (
                    <button
                      key={`${p.d.id}:${p.k}`}
                      className={"chip" + (actif ? " act" : "")}
                      aria-pressed={actif}
                      style={vars({ "--dc": teinte(p.d.id) })}
                      onClick={() => maj({ ref: cleDe(p) })}
                    >
                      <span className="sw" />
                      {nomDalle(p, locale)}
                      {!enScene && (
                        <span className="hors">{dict.surface.horsScene}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Barres
            panneaux={panneaux}
            cat={cat}
            ctx={ctx}
            dalleRef={dalleRef}
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
            dalleRef={dalleRef}
            nomRef={ctx.nomRef}
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
              dalleRef={dalleRef}
              ctx={ctx}
              dict={dict}
              f={f}
              locale={locale}
            />
          </div>
        </div>
      </section>

      {/*
        Section 05. Elle est rendue ici et non plus dans page.tsx : ses verdicts
        citent des ecarts, donc ils dependent de la dalle de reference, donc de
        l'etat de cette page. La section 06 reste au serveur -- ses notes de
        methode n'utilisent ni delta(), ni REF, ni nomRef.
      */}
      <Verdicts ctx={ctx} dict={dict} />
    </>
  );
}
