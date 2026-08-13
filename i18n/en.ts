import type { Dictionnaire } from "./types";

const N = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export const en: Dictionnaire = {
  code: "en",
  nomLangue: "English",
  nombreM: (n) => N[n] ?? String(n),
  nombreF: (n) => N[n] ?? String(n),

  meta: {
    titre: (n) => `${cap(N[n] ?? String(n))} screens to scale`,
    description: (n, p) =>
      `The screens of ${N[n] ?? n} smartphones drawn at true relative scale: ` +
      `${p} panels, measured on one millimetre grid, from officially published data only.`,
  },

  entete: {
    eyebrow: "Measurement bench · recorded 13 August 2026",
    titre: (n) => `${cap(N[n] ?? String(n))} screens`,
    titreAccent: "to scale",
    lede: (dalles, defaut) =>
      `Google unveiled the Pixel 11 Pro Fold, the Pixel 11 Pro and the Pixel 11 Pro XL yesterday. ` +
      `Facing them, Samsung's two foldables — the Galaxy Z Fold8 Ultra, which folds like a book, and ` +
      `the Galaxy Z Fold8, which folds across its width — plus the Pixel 7 Pro as the yardstick for a ` +
      `conventional phone. ${cap(N[dalles] ?? String(dalles))} panels in all, every one drawn here at ` +
      `true relative scale on the same millimetre grid. The stage opens on ${N[defaut] ?? defaut} of ` +
      `them: add the rest with a click, and the following sections follow your selection.`,
    badgeOfficiel: "Every specification is <b>official</b>",
    badgeCalcule: "Figures in mm, cm² and dp are <b>computed</b>",
    badgeRumeur: "No rumoured data",
    choixLangue: "Language",
  },

  ctl: {
    appareils: "Devices",
    disposition: "Layout",
    ecranPliables: "Foldable display",
    reperes: "Dimensions",
    animation: "Animation",
    ficheTechnique: "Spec panel",
    contenu: "Content",
    pliables: "Foldables",
    modes: { side: "Side by side", stack: "Stacked", center: "Centred" },
    etats: { closed: "Closed (cover)", open: "Open (inner)" },
    etatsCourts: { closed: "Closed", open: "Open" },
    marques: {
      w: "Width",
      h: "Height",
      d: "Diagonal",
      a: "Area",
      e: "Thickness",
    },
    rejouer: "↻ Replay the animation",
    replierFiche: "Collapse the panel",
    deplierFiche: "Expand the panel",
    replierFicheTitre: "Collapse the spec panel",
  },

  banc: {
    eyebrow: "01 — Superimposition",
    titre: "The same millimetre for everyone",
    intro:
      "Each rectangle is the active display area, computed from the official diagonal and the " +
      "resolution. Unfold them, stack them, centre them — and hold a bank card against the screen to " +
      "switch to 1:1.",
    echelle: "Scale",
    tranche:
      "The devices seen edge-on, at the same scale: the thickness of each chassis, folded or " +
      "unfolded according to the foldables' state.",
    reinitialiser: "Reset",
    unite: (v) => `${v} px/mm`,
    indiceDefilement: "↔ the stage scrolls sideways at this scale",
    carte: "Bank card<br>85.6 × 54 mm",
    aideCalibration:
      "Grid = 10 mm. Drag the scale until the template matches a real bank card held against your " +
      "screen: the comparison then becomes life-size. Your setting is kept on this device for your next " +
      "visit; “Reset” forgets it.",
    exploration:
      "Free exploration — <b>layout</b>, <b>fold state</b> and <b>dimensions</b> drive the stage. " +
      "Hover a device for its specifications.",
    etapes: (c) => [
      {
        cap: `<b>The Pixel 7 Pro.</b> 6.7 inches, ${c.f.f1(c.REF.area)} cm² of display — our yardstick.`,
      },
      {
        cap:
          `<b>Four years on, the Pixel 11 Pro and 11 Pro XL settle on top of it.</b> The XL grows to ` +
          `6.8 inches and gains just <b>${c.f.pc(c.delta(c.XL.area))}</b> of area: its 20:9 is narrower ` +
          `than the 7 Pro's 19.5:9. The 11 Pro actually falls back to ${c.f.pc(c.delta(c.P11.area))}.`,
      },
      {
        cap:
          "<b>The Pixel 11 Pro Fold lands on top, closed.</b> Almost the same footprint: 6.5″ against " +
          "6.7″, and the very same 19.5:9 ratio.",
      },
      {
        cap:
          `<b>It opens.</b> 8 inches, ${c.f.f1(c.FI.area)} cm²: the display area very nearly doubles in ` +
          `a single gesture.`,
      },
      {
        cap:
          "<b>The Galaxy Z Fold8 Ultra enters.</b> The same 8-inch inner diagonal, but a taller display " +
          "and a narrower chassis.",
      },
      {
        cap:
          "<b>And the Galaxy Z Fold8, which folds the other way.</b> Closed it is short and wide; open " +
          "it spreads out horizontally at 4:3 — the widest of the six.",
      },
      {
        cap: "<b>All six line up</b>, centred on one another and turned translucent.",
      },
      {
        cap: "<b>The dimensions drop in:</b> width, height, diagonal and area, panel by panel.",
      },
      {
        cap:
          "<b>And side by side, open, dimensioned, to scale.</b> The view settles on the largest bar " +
          "phone of the moment and the two most opposed foldables. <b>The other three devices stay one " +
          "click away</b> under “Devices” — including the Pixel 7 Pro, which remains the reference for " +
          "every percentage even when it is not on stage. The sections below show only what you select " +
          "here.",
      },
    ],
  },

  fiche: {
    dalle: "Panel",
    diagonale: "Diagonal",
    resolution: "Resolution",
    densite: "Density",
    ratio: "Aspect ratio",
    frequence: "Refresh rate",
    crete: "Peak",
    zoneActive: "Active area",
    surface: "Area",
    ecartRef: (nom) => `vs ${nom}`,
    largeurLogique: "Logical width",
    classeAndroid: "Android class",
    chassis: "Chassis",
    dimensions: "Dimensions",
    protection: "Cover glass",
    reference: "reference",
    unique: "single",
    deplie: "open",
    replie: "closed",
    ligneRole: (role, date, poids) => `${role} · announced ${date} · ${poids} g`,
  },

  surface: {
    eyebrow: "02 — Display area",
    titre: "What folding buys, in square centimetres",
    intro: (dalles) =>
      `Area of the active rectangle, rounded corners not deducted. The amber marker sits at the Pixel ` +
      `7 Pro's 100 %. The panels listed follow your device selection; bar lengths, however, stay ` +
      `normalised against the largest of all ${N[dalles] ?? dalles}, so they remain comparable from one ` +
      `selection to the next.`,
    externe: "cover",
    interne: "inner",
    affirmations: (c) => [
      {
        deviceId: c.fold.id,
        texte:
          `The open display of the <b>Pixel 11 Pro Fold</b> offers <span class="big">${c.f.pc(c.delta(c.FI.area))}</span> ` +
          `more display area than the Pixel 7 Pro — ${c.f.f1(c.FI.area)} cm² against ` +
          `${c.f.f1(c.REF.area)} cm². Closed, it gives back ${c.f.pc(c.delta(c.FC.area))}.`,
      },
      {
        deviceId: c.sam.id,
        texte:
          `The open display of the <b>Galaxy Z Fold8 Ultra</b> offers <span class="big">${c.f.pc(c.delta(c.SI.area))}</span> ` +
          `against the Pixel 7 Pro — ${c.f.f1(c.SI.area)} cm², within ${c.f.pc((c.SI.area / c.FI.area - 1) * 100)} ` +
          `of the Pixel. Its 21:9 cover display is the narrowest of the lot: ${c.f.f1(c.SC.w)} mm wide.`,
      },
      {
        deviceId: c.sam8.id,
        texte:
          `The open display of the <b>Galaxy Z Fold8</b> offers only <span class="big">${c.f.pc(c.delta(c.WI.area))}</span> ` +
          `— ${c.f.f1(c.WI.area)} cm², the smallest inner panel of the three foldables. But it is the ` +
          `<b>widest</b>: ${c.f.f1(c.WI.w)} mm of usable display, or ${c.f.pc((c.WI.w / c.FI.w - 1) * 100)} ` +
          `on the Pixel 11 Pro Fold. It trades height for width.`,
      },
      {
        deviceId: c.sam8.id,
        texte:
          `Closed, that same Z Fold8 is the only one that does not look like a phone: ${c.f.f1(c.WC.w)} × ` +
          `${c.f.f1(c.WC.h)} mm of display at 10:16, <b>${c.f.pc(c.delta(c.WC.area))}</b> of area against ` +
          `the Pixel 7 Pro. It is the smallest of the ${N[c.cat.tousPanneaux.length] ?? c.cat.tousPanneaux.length} ` +
          `screens measured here.`,
      },
      {
        deviceId: c.fold.id,
        texte: (() => {
          const gains = c.cat.appareils
            .filter((d) => d.kind === "fold")
            .map((d) => ({
              name: d.name,
              gain: d.screens.inner.area / d.screens.cover.area,
              cw: d.screens.cover.w,
            }));
          const max = gains.reduce((a, b) => (b.gain > a.gain ? b : a));
          return (
            `Opening up returns <b>${c.f.pc((c.FI.area / c.FC.area - 1) * 100)}</b> on the Pixel 11 Pro ` +
            `Fold, <b>${c.f.pc((c.SI.area / c.SC.area - 1) * 100)}</b> on the Z Fold8 Ultra and ` +
            `<b>${c.f.pc((c.WI.area / c.WC.area - 1) * 100)}</b> on the Z Fold8: the <b>${max.name}</b> ` +
            `gains the most from unfolding, because it starts from the narrowest cover display ` +
            `(${c.f.f1(max.cw)} mm wide).`
          );
        })(),
      },
      {
        deviceId: null,
        texte:
          `Between the two 8-inch panels the gap is minute: <b>${c.f.f1(c.FI.area)} cm²</b> against ` +
          `<b>${c.f.f1(c.SI.area)} cm²</b>, or ${c.f.pc((c.FI.area / c.SI.area - 1) * 100)} in the Pixel's ` +
          `favour. The Z Fold8 and its 7.6 inches stay ${c.f.pc((c.WI.area / c.FI.area - 1) * 100)} below. ` +
          `The difference is decided elsewhere — in the shape.`,
      },
    ],
  },

  usage: {
    eyebrow: "03 — In use",
    titre: "The same interface, from smallest to largest",
    intro:
      "Content is drawn at a constant physical size — exactly what Android does with its " +
      '<span class="num">dp</span> (1 dp ≈ 0.159 mm on every panel). A larger screen therefore does not ' +
      "magnify the interface: it shows more of it.",
    note: "",
    ouvert: "open",
    ferme: "closed",
    scenes: {
      web: {
        nom: "Web page",
        note:
          "Estimated at 16 dp type on 24 dp leading. The Pixel 7 Pro shows almost as many lines as a " +
          "book-style foldable — but half as wide, so half as much text per line. The Z Fold8, open in " +
          "landscape, shows fewer lines than the Pixel 7 Pro but twice as long.",
      },
      video: {
        nom: "16:9 video",
        note:
          "A full-screen 16:9 frame, device turned to landscape. The usable rectangle is inscribed in " +
          "the panel — a squarer screen loses more to letterboxing.",
      },
      list: {
        nom: "App list",
        note: "72 dp rows, the standard height of a two-line Android list item.",
      },
      multi: {
        nom: "Two apps side by side",
        note:
          "Android splits top/bottom on a tall screen, and side by side as soon as the panel approaches " +
          "square. Each pane of an open foldable is worth a whole phone screen; on the Pixel 7 Pro, each " +
          "pane loses half its height.",
      },
    },
    metriques: {
      caracteres: (n) => `${n} characters`,
      lignes: (l, p) => `≈ ${l} lines × ${p} chars`,
      image: (s) => `${s} cm² of picture`,
      partDalle: (pct, rel) => `${pct} % of the panel · ${rel}`,
      elements: (n) => plural(n, "item") + " visible",
      hauteurDp: (dp) => `${dp} dp tall`,
      volets: (l, h) => `2 × ${l} × ${h} dp`,
      voletsCote: "panes side by side",
      voletsEmpiles: "panes stacked",
      reference: "reference",
      versRef: (ecart, nom) => `${ecart} vs ${nom}`,
    },
    ui: {
      actualite: "news",
      titreArticle: "Hinges: what ten years of folding taught the engineers",
      titreArticleCourt: "Hinges: ten years of folding",
      boiteReception: "inbox",
      messages: "messages",
      article: "article",
    },
  },

  tableau: {
    eyebrow: "04 — Full record",
    titre: (n) =>
      n === 0
        ? "The panels, row by row"
        : n === 1
          ? "The panel, row by row"
          : `The ${N[n] ?? n} panels, row by row`,
    intro:
      'Values marked <span class="num" style="color:var(--acc)">◆</span> are computed from official ' +
      "data, not published by the manufacturer.",
    groupes: {
      identite: "Identity",
      dalle: "Panel",
      geometrie: "Computed geometry",
      chassis: "Chassis",
    },
    lignes: {
      caracteristique: "Specification",
      reference: "Exact model",
      annonce: "Official announcement",
      statut: "Data status",
      poids: "Weight",
      technologie: "Technology",
      diagonale: "Diagonal",
      resolution: "Resolution",
      densitePubliee: "Published density",
      densiteRecalculee: "Recomputed density",
      ratio: "Aspect ratio",
      rafraichissement: "Refresh rate",
      luminositeCrete: "Peak brightness",
      luminositeHdr: "HDR brightness",
      protection: "Cover glass",
      zoneAffichage: "Display area",
      surface: "Surface",
      ecart: (nom) => `Difference vs ${nom}`,
      largeurLogique: "Logical width",
      hauteurLogique: "Logical height",
      classeLargeur: "Android width class",
      encombrement: "Height × width × thickness",
    },
    officielle: "official",
    nonCommuniquee: "not published",
    reference: "reference",
  },

  verdictSection: {
    eyebrow: (r, n) =>
      `05 — ${cap(N[r] ?? String(r))} answer${r > 1 ? "s" : ""}, ${N[n] ?? n} caveat${n > 1 ? "s" : ""}`,
    titre: "The summary",
    verdicts: (c) => [
      {
        q: "The largest display",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        w:
          `<span class="num">${c.f.f1(c.FI.area)} cm²</span> open, against ` +
          `<span class="num">${c.f.f1(c.SI.area)} cm²</span> on the Z Fold8 Ultra: a gap of only ` +
          `<span class="num">${c.f.pc((c.FI.area / c.SI.area - 1) * 100)}</span>, at an identical 8-inch ` +
          `diagonal. The Z Fold8 and its 7.6 inches stay well behind at ` +
          `<span class="num">${c.f.f1(c.WI.area)} cm²</span>.`,
      },
      {
        q: "The widest once open",
        deviceId: c.sam8.id,
        a: "Galaxy Z Fold8",
        w:
          `<span class="num">${c.f.f1(c.WI.w)} mm</span> of usable display width, against ` +
          `<span class="num">${c.f.f1(c.FI.w)} mm</span> on the Pixel and ` +
          `<span class="num">${c.f.f1(c.SI.w)} mm</span> on the Fold8 Ultra — plus ` +
          `<span class="num">${c.f.f1(c.sam8.body.open.w)} mm</span> of chassis, the widest of the six. ` +
          `It is the only one to open at ${c.t(c.WI.ratio)}: it gains in width what it loses in height ` +
          `(<span class="num">${c.f.f1(c.WI.h)} mm</span> against ${c.f.f1(c.FI.h)}).`,
      },
      {
        q: "The foldable closest to the Pixel 7 Pro, closed",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        w:
          `The same <span class="num">19.5:9</span> ratio as the Pixel 7 Pro and ` +
          `<span class="num">${c.f.f1(c.FC.w)} mm</span> wide against ` +
          `<span class="num">${c.f.f1(c.REF.w)} mm</span> — a mere ` +
          `<span class="num">${c.f.pc(c.delta(c.FC.area))}</span> of area. The Fold8 Ultra, at ` +
          `<span class="num">21:9</span>, is narrower; the Fold8, short and wide at ` +
          `<span class="num">10:16</span>, no longer looks like a conventional phone at all.`,
      },
      {
        q: "The most usable area for multitasking",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        w:
          `Two side-by-side panes of <span class="num">${c.f.f0(c.FI.dpW / 2)} × ${c.f.f0(c.FI.dpH)} dp</span>, ` +
          `or <span class="num">${c.f.f1(c.FI.area / 2)} cm²</span> each, against ` +
          `<span class="num">${c.f.f1(c.SI.area / 2)} cm²</span> on the Fold8 Ultra and ` +
          `<span class="num">${c.f.f1(c.WI.area / 2)} cm²</span> on the Fold8. The Fold8 offers the ` +
          `<b>widest</b> panes (<span class="num">${c.f.f0(c.WI.dpW / 2)} dp</span> against ` +
          `${c.f.f0(c.FI.dpW / 2)}) but the shortest (<span class="num">${c.f.f0(c.WI.dpH)} dp</span> ` +
          `against ${c.f.f0(c.FI.dpH)}). All three clear the 840 dp “expanded” threshold that triggers ` +
          `tablet layouts.`,
      },
      {
        q: "What four years of bar phones delivered",
        deviceId: c.p11xl.id,
        a: "Pixel 11 Pro XL",
        w:
          `From the 2022 Pixel 7 Pro to the Pixel 11 Pro XL the diagonal climbs from 6.7 to 6.8 inches, ` +
          `but the area gains only <span class="num">${c.f.pc(c.delta(c.XL.area))}</span> — ` +
          `<span class="num">${c.f.f1(c.XL.area)} cm²</span> against ${c.f.f1(c.REF.area)}. The 20:9 ` +
          `ratio, narrower than 19.5:9, absorbs the inch gained. The Pixel 11 Pro even falls back to ` +
          `<span class="num">${c.f.f1(c.P11.area)} cm²</span>, or ${c.f.pc(c.delta(c.P11.area))}. That is ` +
          `the whole argument for folding: in a single gesture the Pixel 11 Pro Fold delivers ` +
          `<span class="num">${c.f.pc(c.delta(c.FI.area))}</span>.`,
      },
      {
        q: "The caveat: video",
        deviceId: c.sam8.id,
        a: "Galaxy Z Fold8",
        nuance: true,
        w:
          `The smallest inner display gives the largest 16:9 picture: ` +
          `<span class="num">${c.f.f1(c.vid(c.WI))} cm²</span>, against ` +
          `<span class="num">${c.f.f1(c.vid(c.SI))} cm²</span> on the Fold8 Ultra and ` +
          `<span class="num">${c.f.f1(c.vid(c.FI))} cm²</span> on the Pixel. A near-square screen loses ` +
          `everything to black bars; a 4:3 landscape panel, far less.`,
      },
      {
        q: "The caveat: brightness",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        nuance: true,
        w:
          `<span class="num">${c.f.f0(c.FI.peak)} nits</span> peak on both panels, against ` +
          `<span class="num">${c.f.f0(c.SI.peak)}</span> on the Fold8 Ultra and ` +
          `<span class="num">${c.f.f0(c.WI.peak)}</span> on the Fold8. The Fold8 Ultra, on the other ` +
          `hand, holds its ${c.f.f0(c.SI.hdr ?? 0)} nits in HDR, where the Pixel drops to ` +
          `<span class="num">${c.f.f0(c.FI.hdr ?? 0)}</span>. The Fold8 Ultra remains the thinnest when ` +
          `open (<span class="num">${c.f.f1(c.sam.body.open.d)} mm</span>) and its inner panel the ` +
          `densest (<span class="num">${c.SI.ppi} ppi</span>, against ${c.WI.ppi} on the Fold8 and ` +
          `${c.FI.ppi} on the Pixel); the Fold8 is the lightest of the three ` +
          `(<span class="num">${c.sam8.weight} g</span>).`,
      },
    ],
  },

  sources: {
    eyebrow: "06 — Method and sources",
    titre: "Where these figures come from",
    notes: (c) => [
      `<b>Data status.</b> All ${N[c.cat.appareils.length] ?? c.cat.appareils.length} devices are on ` +
        `sale or officially announced: Pixel 7 Pro (6 Oct. 2022), Galaxy Z Fold8 and Z Fold8 Ultra ` +
        `(Unpacked of 22 Jul. 2026, on sale the same day), Pixel 11 Pro Fold, Pixel 11 Pro and ` +
        `Pixel 11 Pro XL (announced 12 August 2026, on sale from 20 August). No rumoured estimate enters ` +
        `this comparison.`,
      `<b>Display area.</b> The width and height of the active rectangle are derived from the official ` +
        `diagonal and the resolution: <span class="num">W = D × w<sub>px</sub> / √(w<sub>px</sub>² + h<sub>px</sub>²)</span>. ` +
        `Rounded corners — and, on the Pixel 7 Pro, the slight curvature of the edges — are not deducted, ` +
        `so real areas are 1 to 3 % lower, comparably for all of them.`,
      `<b>Densities.</b> The ppi figures shown are those published by the manufacturers; recomputing them ` +
        `geometrically gives ±1 % (for instance ${Math.round(c.FC.ppiCalc)} instead of ${c.FC.ppi} on the ` +
        `Pixel 11 Pro Fold's cover display, the diagonal being rounded to 6.5″). The widest gap in the ` +
        `record is the <b>Pixel 11 Pro XL</b>: ${Math.round(c.XL.ppiCalc)} ppi recomputed against ` +
        `${c.XL.ppi} published, or ${c.f.f1(Math.abs(c.XL.ppiCalc / c.XL.ppi - 1) * 100)} %, again from ` +
        `rounding the diagonal to 6.8″.`,
      `<b>Pixel 11 Pro Fold inner resolution.</b> The Google Store states ${c.FI.px[0]} × ${c.FI.px[1]} px; ` +
        `some press reports write 2151 × 2076. A one-pixel difference has no effect on the measurements.`,
      `<b>Bezels.</b> Displays are drawn centred within the chassis, with bezels distributed symmetrically ` +
        `— a graphical approximation; none of the numeric figures depend on it.`,
      `<b>Samsung model numbers.</b> The two July 2026 foldables are Samsung's most recent models: the ` +
        `<b>Galaxy Z Fold8</b> carries <span class="num">SM-F971</span> (variants SM-F971B, SM-F971B/DS, ` +
        `SM-F971U, SM-F971U1) and the <b>Galaxy Z Fold8 Ultra</b> <span class="num">SM-F976</span> ` +
        `(SM-F976B / U / N), according to specialist databases; Samsung does not publish these codes on ` +
        `its product pages.`,
      `<b>Two folding directions.</b> The Z Fold8 Ultra folds like a book: its height stays constant ` +
        `(${c.f.f1(c.sam.body.closed.h)} mm) while its width doubles. The Z Fold8 folds across its width: ` +
        `it is the height that stays constant (${c.f.f1(c.sam8.body.closed.h)} mm) while the width goes ` +
        `from ${c.f.f1(c.sam8.body.closed.w)} to ${c.f.f1(c.sam8.body.open.w)} mm. Its inner display ` +
        `therefore opens in <b>landscape</b> — which is why it appears wider and shorter than the others ` +
        `on stage, and why its ratio is given as 4:3 landscape.`,
      `<b>Z Fold8 resolution.</b> Samsung and the databases publish ` +
        `<span class="num">1848 × 2448 px</span> for the inner panel and ` +
        `<span class="num">1248 × 1972 px</span> for the cover display. The inner panel is reported here ` +
        `in its orientation of use (2448 px across the physical width of ${c.f.f1(c.WI.w)} mm): the pixel ` +
        `count and the density are identical, only the reading orientation changes.`,
      `<b>Z Fold8 brightness.</b> Samsung states <b>${c.f.f0(c.WI.peak)} nits</b> peak on both panels; ` +
        `GSMArena credits the inner panel with 3,000 nits. The manufacturer's official figure is the one ` +
        `used here. HDR brightness is not published for this model, hence “not published”.`,
      `<b>Z Fold8 refresh rate.</b> Samsung publishes only “120 Hz”; the adaptive 1 Hz floor, specific to ` +
        `LTPO and announced on the Fold8 Ultra, is not confirmed for this model. It is therefore given as ` +
        `<span class="num">120 Hz (LTPO)</span> rather than 1–120 Hz.`,
      `<b>Usage estimates.</b> Text lines, list items and visible characters are modelled (16 dp type, ` +
        `24 dp leading, 72 dp list rows, 8.2 dp average character width) — orders of magnitude, not ` +
        `measurements. The Android width class (compact &lt; 600 dp, medium 600–840, expanded ≥ 840) is, ` +
        `by contrast, a real threshold in the system.`,
    ],
  },

  pied: {
    releve:
      "Recorded 13 August 2026. The specifications of the three Pixels announced the day before may " +
      "still be refined by the manufacturer.",
    recalcul:
      "Display areas, surfaces, dp figures and percentage differences are recomputed in the page from " +
      "officially published data alone.",
  },

  classes: {
    compact: "Compact < 600 dp",
    medium: "Medium 600–840 dp",
    expanded: "Expanded ≥ 840 dp",
  },
  classesCourtes: { compact: "Compact < 600", medium: "Medium 600–840", expanded: "Expanded ≥ 840" },

  vide: "No device selected — switch one on under <b>Devices</b>, at the top of the page.",
};
