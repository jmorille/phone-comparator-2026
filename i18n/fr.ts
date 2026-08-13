import type { Dictionnaire } from "./types";

const M = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
const F = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const fr: Dictionnaire = {
  code: "fr",
  nomLangue: "Français",
  nombreM: (n) => M[n] ?? String(n),
  nombreF: (n) => F[n] ?? String(n),

  meta: {
    titre: "Les écrans à l'échelle",
    description:
      "Les écrans de smartphones, de pliables et de tablettes dessinés à l'échelle réelle " +
      "relative : toutes les dalles mesurées sur la même grille millimétrique, à partir des " +
      "seules données officielles.",
  },

  entete: {
    eyebrow: "Banc de mesure · relevé du 13 août 2026",
    titre: "Les écrans",
    titreAccent: "à l'échelle",
    lede: (defaut) =>
      `Google a présenté hier le Pixel 11 Pro Fold, le Pixel 11 Pro et le Pixel 11 Pro XL. ` +
      `Face à eux, les deux pliables de Samsung — le Galaxy Z Fold8 Ultra, qui plie comme un livre, ` +
      `et le Galaxy Z Fold8, qui plie en largeur — et le Pixel 7 Pro comme mètre-étalon de départ du ` +
      `smartphone classique, que la section 02 permet de remplacer par n'importe quelle autre dalle. ` +
      `La Galaxy Tab S10+ ferme la marche : elle n'est pas un téléphone, et c'est bien ` +
      `l'intérêt — elle donne l'échelle vers laquelle un pliable déplié tend sans jamais l'atteindre. ` +
      `Toutes les dalles sont dessinées ici à l'échelle réelle relative, mesurées sur la même grille ` +
      `millimétrique. La scène démarre sur ${M[defaut] ?? defaut} appareils : ajoutez les autres d'un ` +
      `clic, les sections suivantes suivent votre sélection.`,
    badgeOfficiel: "Toutes les fiches techniques sont <b>officielles</b>",
    badgeCalcule: "Les cotes en mm, cm² et dp sont <b>calculées</b>",
    badgeRumeur: "Aucune donnée de rumeur",
    choixLangue: "Langue",
  },

  ctl: {
    appareils: "Appareils",
    disposition: "Disposition",
    ecranPliables: "Écran des pliables",
    comparerA: "Comparer à",
    reperes: "Repères",
    animation: "Animation",
    ficheTechnique: "Fiche technique",
    contenu: "Contenu",
    pliables: "Pliables",
    modes: { side: "Côte à côte", stack: "Superposition", center: "Centré" },
    etats: { closed: "Fermé (externe)", open: "Ouvert (interne)" },
    etatsCourts: { closed: "Fermé", open: "Ouvert" },
    marques: {
      w: "Largeur",
      h: "Hauteur",
      d: "Diagonale",
      a: "Surface",
      e: "Épaisseur",
    },
    rejouer: "↻ Rejouer l'animation",
    replierFiche: "Replier la fiche",
    deplierFiche: "Déplier la fiche",
    replierFicheTitre: "Replier la fiche technique",
  },

  banc: {
    eyebrow: "01 — Superposition",
    titre: "Le même millimètre pour tout le monde",
    intro:
      "Chaque rectangle est la zone d'affichage active, calculée à partir de la diagonale officielle " +
      "et de la résolution. Dépliez, superposez, centrez — et posez une carte bancaire sur l'écran " +
      "pour passer en 1:1.",
    echelle: "Échelle",
    tranche:
      "Les appareils vus par la tranche, à la même échelle : l'épaisseur de chaque châssis, " +
      "repliée ou dépliée selon l'état des pliables.",
    reinitialiser: "Réinitialiser",
    unite: (v) => `${v} px/mm`,
    indiceDefilement: "↔ la scène défile latéralement à cette échelle",
    carte: "Carte bancaire<br>85,6 × 54 mm",
    aideCalibration:
      "Grille = 10 mm. Faites glisser l'échelle jusqu'à ce que le gabarit corresponde à une vraie " +
      "carte bancaire posée sur l'écran : la comparaison devient alors grandeur nature. Votre réglage " +
      "est conservé sur cet appareil pour vos prochaines visites ; « Réinitialiser » l'oublie.",
    exploration:
      "Exploration libre — <b>disposition</b>, <b>état du pli</b> et <b>repères</b> pilotent la scène. " +
      "Survolez un appareil pour sa fiche.",
    etapes: (c) => [
      {
        cap:
          `<b>Le Pixel 7 Pro.</b> 6,7 pouces, ${c.f.f1(c.P7.area)} cm² d'affichage — le repère de ` +
          `départ, celui auquel la suite se compare.`,
      },
      {
        cap:
          `<b>Quatre ans plus tard, les Pixel 11 Pro et 11 Pro XL s'y superposent.</b> Le XL passe à ` +
          `6,8 pouces et n'y gagne que <b>${c.f.pc(c.deltaP7(c.XL.area))}</b> de surface : son 20:9 est ` +
          `plus étroit que le 19,5:9 du 7 Pro. Le 11 Pro, lui, redescend à ${c.f.pc(c.deltaP7(c.P11.area))}.`,
      },
      {
        cap:
          "<b>Le Pixel 11 Pro Fold vient se poser dessus, replié.</b> Presque le même gabarit : " +
          "6,5″ contre 6,7″, et le même ratio 19,5:9.",
      },
      {
        cap:
          `<b>Il se déplie.</b> 8 pouces, ${c.f.f1(c.FI.area)} cm² : la surface d'affichage double ` +
          `presque d'un seul geste.`,
      },
      {
        cap:
          "<b>Le Galaxy Z Fold8 Ultra entre en scène.</b> Même diagonale interne de 8 pouces, mais " +
          "un écran plus allongé et un châssis plus étroit.",
      },
      {
        cap:
          "<b>Et le Galaxy Z Fold8, qui plie dans l'autre sens.</b> Replié, il est court et large ; " +
          "déplié, il s'étale à l'horizontale en 4:3 — le plus large des pliables.",
      },
      {
        cap:
          `<b>La Galaxy Tab S10+ referme la comparaison.</b> ${c.f.f1(c.TAB.area)} cm² : ` +
          `<b>${c.f.pc((c.TAB.area / c.FI.area - 1) * 100)}</b> sur le plus grand des pliables déplié, ` +
          `pour ${c.f.f1(c.tabs10p.body.closed.d)} mm d'épaisseur seulement. Voilà la marche qui reste ` +
          `à franchir.`,
      },
      {
        cap: "<b>Tous les appareils s'alignent</b>, centrés les uns sur les autres et rendus translucides.",
      },
      {
        cap: "<b>Les repères tombent :</b> largeur, hauteur, diagonale et surface, dalle par dalle.",
      },
      {
        cap:
          "<b>Et côte à côte, dépliés, cotés, à l'échelle.</b> La vue s'arrête sur le plus grand " +
          "téléphone du moment, les deux pliables les plus opposés et la tablette. <b>Les autres " +
          "appareils restent à un clic</b> dans « Appareils » — dont le Pixel 7 Pro, la référence de " +
          "départ des pourcentages. La section 02 laisse prendre n'importe quelle dalle cochée comme " +
          "repère à sa place. Les sections suivantes ne montrent que ce que vous sélectionnez ici.",
      },
    ],
  },

  fiche: {
    dalle: "Dalle",
    diagonale: "Diagonale",
    resolution: "Résolution",
    densite: "Densité",
    ratio: "Ratio",
    frequence: "Fréquence",
    crete: "Crête",
    zoneActive: "Zone active",
    surface: "Surface",
    ecartRef: (nom) => `vs ${nom}`,
    largeurLogique: "Largeur logique",
    classeAndroid: "Classe Android",
    chassis: "Châssis",
    dimensions: "Dimensions",
    protection: "Protection",
    reference: "référence",
    unique: "unique",
    deplie: "déplié",
    replie: "replié",
    ligneRole: (role, date, poids) => `${role} · annoncé le ${date} · ${poids} g`,
  },

  surface: {
    eyebrow: "02 — Surface d'affichage",
    titre: "Ce que le pli rend, en centimètres carrés",
    intro: (nomRef) =>
      `Surface du rectangle actif, coins arrondis non déduits. Le repère ambré marque les 100 % — ` +
      `celui du <b>${nomRef}</b>, que vous pouvez changer ci-dessus : rien n'oblige à toujours ` +
      `comparer au même appareil. Les dalles listées suivent votre sélection ; la longueur des ` +
      `barres, elle, reste normée sur la plus grande dalle du catalogue, pour rester comparable d'une ` +
      `sélection à l'autre — c'est aujourd'hui celle de la tablette, et c'est pourquoi les barres des ` +
      `téléphones en occupent moins de la moitié.`,
    horsScene: "hors scène",
    externe: "externe",
    interne: "interne",
    affirmations: (c) => [
      {
        deviceId: c.fold.id,
        texte:
          `L'écran ouvert du <b>Pixel 11 Pro Fold</b> offre <span class="big">${c.ecartCite(c.FI).pc}</span> ` +
          `de surface d'affichage par rapport au ${c.ecartCite(c.FI).nom} — ${c.f.f1(c.FI.area)} cm² ` +
          `contre ${c.f.f1(c.ecartCite(c.FI).contre.area)} cm². Refermé, il en perd ` +
          `${c.f.pc(c.delta(c.FC.area))}.`,
      },
      {
        deviceId: c.sam.id,
        texte:
          `L'écran ouvert du <b>Galaxy Z Fold8 Ultra</b> offre <span class="big">${c.ecartCite(c.SI).pc}</span> ` +
          `par rapport au ${c.ecartCite(c.SI).nom} — ${c.f.f1(c.SI.area)} cm², à ${c.f.pc((c.SI.area / c.FI.area - 1) * 100)} ` +
          `du Pixel. Son écran externe, en 21:9, est le plus étroit du lot : ${c.f.f1(c.SC.w)} mm de large.`,
      },
      {
        deviceId: c.sam8.id,
        texte:
          `L'écran ouvert du <b>Galaxy Z Fold8</b> n'offre que <span class="big">${c.ecartCite(c.WI).pc}</span> ` +
          `— ${c.f.f1(c.WI.area)} cm², la plus petite dalle interne des trois pliables. Mais c'est la plus ` +
          `<b>large</b> : ${c.f.f1(c.WI.w)} mm d'affichage utile, soit ${c.f.pc((c.WI.w / c.FI.w - 1) * 100)} ` +
          `sur le Pixel 11 Pro Fold. Il échange de la hauteur contre de la largeur.`,
      },
      {
        deviceId: c.sam8.id,
        texte:
          `Replié, ce même Z Fold8 est le seul à ne pas ressembler à un téléphone : ${c.f.f1(c.WC.w)} × ` +
          `${c.f.f1(c.WC.h)} mm d'écran en 10:16, <b>${c.ecartCite(c.WC).pc}</b> de surface par ` +
          `rapport au ${c.ecartCite(c.WC).nom}. C'est le plus petit écran mesuré ici.`,
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
            `Le geste d'ouverture rapporte <b>${c.f.pc((c.FI.area / c.FC.area - 1) * 100)}</b> sur le ` +
            `Pixel 11 Pro Fold, <b>${c.f.pc((c.SI.area / c.SC.area - 1) * 100)}</b> sur le Z Fold8 Ultra ` +
            `et <b>${c.f.pc((c.WI.area / c.WC.area - 1) * 100)}</b> sur le Z Fold8 : c'est le ` +
            `<b>${max.name}</b> qui gagne le plus au dépliage, parce qu'il part de l'écran externe le ` +
            `plus étroit (${c.f.f1(max.cw)} mm de large).`
          );
        })(),
      },
      {
        deviceId: null,
        texte:
          `Entre les deux dalles de 8 pouces, l'écart est infime : <b>${c.f.f1(c.FI.area)} cm²</b> contre ` +
          `<b>${c.f.f1(c.SI.area)} cm²</b>, soit ${c.f.pc((c.FI.area / c.SI.area - 1) * 100)} en faveur du ` +
          `Pixel. Le Z Fold8 et ses 7,6 pouces restent ${c.f.pc((c.WI.area / c.FI.area - 1) * 100)} en ` +
          `dessous. La différence se joue ailleurs — sur la forme.`,
      },
    ],
  },

  usage: {
    eyebrow: "03 — Mise en situation",
    titre: "La même interface, du plus petit au plus grand",
    intro:
      "Les contenus sont dessinés à taille physique constante — c'est exactement ce que fait Android " +
      'avec ses <span class="num">dp</span> (1 dp ≈ 0,159 mm sur toutes les dalles). Le plus grand écran ' +
      "ne grossit donc pas l'interface : il en montre davantage.",
    note: "",
    ouvert: "ouvert",
    ferme: "fermé",
    scenes: {
      web: {
        nom: "Page web",
        note:
          "Estimation à corps 16 dp et interligne 24 dp. Le Pixel 7 Pro affiche presque autant de lignes " +
          "qu'un pliable ouvert en format livre — mais deux fois moins large, donc deux fois moins de " +
          "texte par ligne. Le Z Fold8, ouvert en paysage, affiche au contraire moins de lignes que le " +
          "Pixel 7 Pro, mais deux fois plus longues.",
      },
      video: {
        nom: "Vidéo 16:9",
        note:
          "Image 16:9 en plein écran, appareil tourné en paysage. Le rectangle utile est calculé par " +
          "inscription dans la dalle — un écran plus carré perd davantage en bandes noires.",
      },
      list: {
        nom: "Liste d'une app",
        note: "Lignes de 72 dp, la hauteur standard d'un élément de liste Android à deux niveaux de texte.",
      },
      multi: {
        nom: "Deux apps en multitâche",
        note:
          "Android partage en haut/bas sur un écran allongé, et côte à côte dès que la dalle s'approche " +
          "du carré. Les deux volets d'un pliable ouvert valent chacun un écran de téléphone entier ; " +
          "sur le Pixel 7 Pro, chaque volet perd la moitié de sa hauteur.",
      },
    },
    metriques: {
      caracteres: (n) => `${n} caractères`,
      lignes: (l, p) => `≈ ${l} lignes × ${p} car.`,
      image: (s) => `${s} cm² d'image`,
      partDalle: (pct, rel) => `${pct} % de la dalle · ${rel}`,
      elements: (n) => `${n} éléments visibles`,
      hauteurDp: (dp) => `${dp} dp de haut`,
      volets: (l, h) => `2 × ${l} × ${h} dp`,
      voletsCote: "volets côte à côte",
      voletsEmpiles: "volets superposés",
      reference: "référence",
      versRef: (ecart, nom) => `${ecart} vs ${nom}`,
    },
    ui: {
      actualite: "actualité",
      titreArticle: "Charnières : ce que dix ans de plis ont appris aux ingénieurs",
      titreArticleCourt: "Charnières : dix ans de plis",
      boiteReception: "boîte de réception",
      messages: "messages",
      article: "article",
    },
  },

  tableau: {
    eyebrow: "04 — Relevé complet",
    titre: (n) =>
      n === 0
        ? "Les dalles, ligne par ligne"
        : n === 1
          ? "La dalle, ligne par ligne"
          : `Les ${F[n] ?? n} dalles, ligne par ligne`,
    intro:
      'Les valeurs marquées <span class="num" style="color:var(--acc)">◆</span> sont calculées à partir ' +
      "des données officielles, pas publiées par le constructeur.",
    groupes: {
      identite: "Identité",
      dalle: "Dalle",
      geometrie: "Géométrie calculée",
      chassis: "Châssis",
    },
    lignes: {
      caracteristique: "Caractéristique",
      reference: "Référence exacte",
      annonce: "Annonce officielle",
      statut: "Statut de la donnée",
      poids: "Poids",
      technologie: "Technologie",
      diagonale: "Diagonale",
      resolution: "Résolution",
      densitePubliee: "Densité publiée",
      densiteRecalculee: "Densité recalculée",
      ratio: "Ratio",
      rafraichissement: "Rafraîchissement",
      luminositeCrete: "Luminosité de crête",
      luminositeHdr: "Luminosité HDR",
      protection: "Protection",
      zoneAffichage: "Zone d'affichage",
      surface: "Surface",
      ecart: (nom) => `Écart vs ${nom}`,
      largeurLogique: "Largeur logique",
      hauteurLogique: "Hauteur logique",
      classeLargeur: "Classe de largeur Android",
      encombrement: "Hauteur × largeur × épaisseur",
    },
    officielle: "officielle",
    nonCommuniquee: "non communiquée",
    reference: "référence",
  },

  verdictSection: {
    eyebrow: (r, n) =>
      `05 — ${cap(F[r] ?? String(r))} réponse${r > 1 ? "s" : ""}, ${F[n] ?? n} nuance${n > 1 ? "s" : ""}`,
    titre: "Le résumé",
    verdicts: (c) => [
      {
        q: "Le plus grand écran",
        deviceId: c.tabs10p.id,
        a: "Galaxy Tab S10+",
        w:
          `<span class="num">${c.f.f1(c.TAB.area)} cm²</span> — ` +
          `<b>${c.f.pc((c.TAB.area / c.FI.area - 1) * 100)}</b> sur le plus grand des pliables ` +
          `déplié, et <b>${c.ecartCite(c.TAB).pc}</b> sur le ${c.ecartCite(c.TAB).nom}. Ce n'est pas une ` +
          `victoire à armes égales : la tablette ne se plie pas, ne tient pas dans une poche et pèse ` +
          `<span class="num">${c.tabs10p.weight} g</span>, soit ` +
          `<span class="num">${c.f.pc((c.tabs10p.weight / c.fold.weight - 1) * 100)}</span> de plus que ` +
          `le Fold. Elle est ici pour donner la mesure de ce que le pli cherche à atteindre — et de ` +
          `ce qui reste à parcourir.`,
      },
      {
        q: "Le plus grand écran de téléphone",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        w:
          `<span class="num">${c.f.f1(c.FI.area)} cm²</span> déplié, contre ` +
          `<span class="num">${c.f.f1(c.SI.area)} cm²</span> au Z Fold8 Ultra : l'écart n'est que de ` +
          `<span class="num">${c.f.pc((c.FI.area / c.SI.area - 1) * 100)}</span>, à diagonale identique ` +
          `de 8 pouces. Le Z Fold8 et ses 7,6 pouces restent loin derrière avec ` +
          `<span class="num">${c.f.f1(c.WI.area)} cm²</span>.`,
      },
      {
        q: "Le pliable le plus large une fois ouvert",
        deviceId: c.sam8.id,
        a: "Galaxy Z Fold8",
        w:
          `<span class="num">${c.f.f1(c.WI.w)} mm</span> d'affichage utile en largeur, contre ` +
          `<span class="num">${c.f.f1(c.FI.w)} mm</span> au Pixel et ` +
          `<span class="num">${c.f.f1(c.SI.w)} mm</span> au Fold8 Ultra — et ` +
          `<span class="num">${c.f.f1(c.sam8.body.open.w)} mm</span> de châssis, le plus ` +
          `large des pliables. C'est le seul à s'ouvrir en ${c.t(c.WI.ratio)} : il gagne en largeur ce qu'il ` +
          `perd en hauteur (<span class="num">${c.f.f1(c.WI.h)} mm</span> contre ${c.f.f1(c.FI.h)}).`,
      },
      {
        q: "Le pliable le plus proche du Pixel 7 Pro, fermé",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        w:
          `Même ratio <span class="num">19,5:9</span> que le Pixel 7 Pro et ` +
          `<span class="num">${c.f.f1(c.FC.w)} mm</span> de large contre ` +
          `<span class="num">${c.f.f1(c.P7.w)} mm</span> — un simple ` +
          `<span class="num">${c.f.pc(c.deltaP7(c.FC.area))}</span> de surface. Le Fold8 Ultra, en ` +
          `<span class="num">21:9</span>, est plus étroit ; le Fold8, court et large en ` +
          `<span class="num">10:16</span>, ne ressemble plus du tout à un téléphone classique.`,
      },
      {
        q: "Le plus de surface utile en multitâche",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        w:
          `Deux volets côte à côte de <span class="num">${c.f.f0(c.FI.dpW / 2)} × ${c.f.f0(c.FI.dpH)} dp</span>, ` +
          `soit <span class="num">${c.f.f1(c.FI.area / 2)} cm²</span> chacun, contre ` +
          `<span class="num">${c.f.f1(c.SI.area / 2)} cm²</span> au Fold8 Ultra et ` +
          `<span class="num">${c.f.f1(c.WI.area / 2)} cm²</span> au Fold8. Le Fold8 offre les volets les ` +
          `plus <b>larges</b> (<span class="num">${c.f.f0(c.WI.dpW / 2)} dp</span> contre ` +
          `${c.f.f0(c.FI.dpW / 2)}) mais les plus courts (<span class="num">${c.f.f0(c.WI.dpH)} dp</span> ` +
          `contre ${c.f.f0(c.FI.dpH)}). Les trois franchissent le seuil « expanded » de 840 dp qui ` +
          `déclenche les mises en page tablette.`,
      },
      {
        q: "Ce que quatre ans de barres ont rendu",
        deviceId: c.p11xl.id,
        a: "Pixel 11 Pro XL",
        w:
          `Du Pixel 7 Pro de 2022 au Pixel 11 Pro XL, la diagonale monte de 6,7 à 6,8 pouces mais la ` +
          `surface ne gagne que <span class="num">${c.f.pc(c.deltaP7(c.XL.area))}</span> — ` +
          `<span class="num">${c.f.f1(c.XL.area)} cm²</span> contre ${c.f.f1(c.P7.area)}. Le 20:9, plus ` +
          `étroit que le 19,5:9, absorbe le pouce gagné. Le Pixel 11 Pro redescend même à ` +
          `<span class="num">${c.f.f1(c.P11.area)} cm²</span>, soit ${c.f.pc(c.deltaP7(c.P11.area))}. C'est ` +
          `tout l'argument du pliable : d'un seul geste, le Pixel 11 Pro Fold offre ` +
          `<span class="num">${c.f.pc(c.deltaP7(c.FI.area))}</span>.`,
      },
      {
        q: "La nuance : la vidéo",
        deviceId: c.sam8.id,
        a: "Galaxy Z Fold8",
        nuance: true,
        w:
          `Le plus petit écran interne donne la plus grande image 16:9 : ` +
          `<span class="num">${c.f.f1(c.vid(c.WI))} cm²</span>, contre ` +
          `<span class="num">${c.f.f1(c.vid(c.SI))} cm²</span> au Fold8 Ultra et ` +
          `<span class="num">${c.f.f1(c.vid(c.FI))} cm²</span> au Pixel. Un écran presque carré perd ` +
          `tout en bandes noires ; un 4:3 paysage, beaucoup moins.`,
      },
      {
        q: "La nuance : la luminosité",
        deviceId: c.fold.id,
        a: "Pixel 11 Pro Fold",
        nuance: true,
        w:
          `<span class="num">${c.f.f0(c.FI.peak)} nits</span> de crête sur les deux dalles, contre ` +
          `<span class="num">${c.f.f0(c.SI.peak)}</span> au Fold8 Ultra et ` +
          `<span class="num">${c.f.f0(c.WI.peak)}</span> au Fold8. Le Fold8 Ultra tient en revanche ses ` +
          `${c.f.f0(c.SI.hdr ?? 0)} nits en HDR, là où le Pixel redescend à ` +
          `<span class="num">${c.f.f0(c.FI.hdr ?? 0)}</span>. Le Fold8 Ultra reste le plus fin déplié ` +
          `(<span class="num">${c.f.f1(c.sam.body.open.d)} mm</span>) et sa ` +
          `dalle interne la plus dense (<span class="num">${c.SI.ppi} ppi</span>, contre ${c.WI.ppi} au ` +
          `Fold8 et ${c.FI.ppi} au Pixel) ; le Fold8 est le plus léger des trois ` +
          `(<span class="num">${c.sam8.weight} g</span>).`,
      },
    ],
  },

  sources: {
    eyebrow: "06 — Méthode et sources",
    titre: "D'où viennent ces chiffres",
    notes: (c) => [
      `<b>Statut des données.</b> Tous les appareils du relevé sont commercialisés ou annoncés ` +
        `officiellement : Pixel 7 Pro (6 oct. 2022), Galaxy Tab S10+ (26 sept. 2024, ventes le 3 oct.), ` +
        `Galaxy Z Fold8 et Z Fold8 Ultra (Unpacked du 22 juil. 2026, sortie le jour même), Pixel 11 Pro ` +
        `Fold, Pixel 11 Pro et Pixel 11 Pro XL (annoncés le 12 août 2026, ventes ouvertes le 20 août). ` +
        `Aucune estimation de rumeur n'entre dans cette comparaison.`,
      `<b>Une tablette parmi des téléphones.</b> La <b>Galaxy Tab S10+</b> n'est pas un concurrent des ` +
        `six autres : elle sert d'échelle haute. Deux conséquences à connaître. Elle est saisie dans ` +
        `l'orientation où Samsung la spécifie, <b>paysage</b> ` +
        `(${c.f.f1(c.tabs10p.body.closed.h)} mm de haut sur ${c.f.f1(c.tabs10p.body.closed.w)} de large), ` +
        `sans quoi elle ne tiendrait pas dans la hauteur de la scène. Et comme la longueur des barres de ` +
        `la section 02 est normée sur la plus grande dalle du catalogue, c'est désormais la sienne qui ` +
        `fixe le 100 % : les barres des téléphones sont donc plus courtes qu'avant son arrivée, sans que ` +
        `leurs surfaces aient changé.`,
      `<b>Deux valeurs que Samsung ne publie pas.</b> La fiche officielle de la Tab S10+ donne la ` +
        `diagonale, la résolution et la technologie de dalle, mais ni sa densité ni la nature de son ` +
        `verre. Les <span class="num">${c.TAB.ppi} ppi</span> affichés viennent de GSMArena — le recalcul ` +
        `géométrique donne ici exactement la même valeur ` +
        `(<span class="num">${Math.round(c.TAB.ppiCalc)} ppi</span>) — et la protection est donnée en ` +
        `dureté Mohs, l'échelle que Samsung emploie pour ses tablettes, faute de verre nommé.`,
      `<b>Zone d'affichage.</b> Largeur et hauteur du rectangle actif déduites de la diagonale officielle ` +
        `et de la résolution : <span class="num">L = D × l<sub>px</sub> / √(l<sub>px</sub>² + h<sub>px</sub>²)</span>. ` +
        `Les coins arrondis et, sur le Pixel 7 Pro, la légère courbure des bords ne sont pas déduits — les ` +
        `surfaces réelles sont donc de 1 à 3 % inférieures, de façon comparable pour tous.`,
      `<b>Densités.</b> Les ppi affichés sont ceux publiés par les constructeurs ; le recalcul géométrique ` +
        `donne ±1 % (par ex. ${Math.round(c.FC.ppiCalc)} au lieu de ${c.FC.ppi} sur l'écran externe du ` +
        `Pixel 11 Pro Fold, la diagonale étant arrondie à 6,5″). L'écart le plus large du relevé est celui ` +
        `du <b>Pixel 11 Pro XL</b> : ${Math.round(c.XL.ppiCalc)} ppi recalculés contre ${c.XL.ppi} publiés, ` +
        `soit ${c.f.f1(Math.abs(c.XL.ppiCalc / c.XL.ppi - 1) * 100)} %, là encore par arrondi de la ` +
        `diagonale à 6,8″.`,
      `<b>Résolution interne du Pixel 11 Pro Fold.</b> Le Google Store indique ${c.FI.px[0]} × ${c.FI.px[1]} px ; ` +
        `certaines reprises presse écrivent 2151 × 2076. L'écart d'un pixel est sans effet sur les mesures.`,
      `<b>Bordures.</b> Les écrans sont dessinés centrés dans le châssis, les bordures réparties ` +
        `symétriquement — approximation graphique, les cotes chiffrées n'en dépendent pas.`,
      `<b>Références Samsung.</b> Les deux pliables de juillet 2026 sont les modèles Samsung les plus ` +
        `récents : le <b>Galaxy Z Fold8</b> est référencé <span class="num">SM-F971</span> (déclinaisons ` +
        `SM-F971B, SM-F971B/DS, SM-F971U, SM-F971U1) et le <b>Galaxy Z Fold8 Ultra</b> ` +
        `<span class="num">SM-F976</span> (SM-F976B / U / N), d'après les bases de données spécialisées ; ` +
        `Samsung ne publie pas ces codes sur ses pages produit.`,
      `<b>Deux sens de pliage.</b> Le Z Fold8 Ultra plie comme un livre : la hauteur reste constante ` +
        `(${c.f.f1(c.sam.body.closed.h)} mm) et la largeur double. Le Z Fold8 plie en largeur : c'est sa ` +
        `hauteur qui reste constante (${c.f.f1(c.sam8.body.closed.h)} mm) tandis que la largeur passe de ` +
        `${c.f.f1(c.sam8.body.closed.w)} à ${c.f.f1(c.sam8.body.open.w)} mm. ` +
        `Son écran interne s'ouvre donc en <b>paysage</b> — c'est pourquoi il apparaît plus large et plus ` +
        `court que les autres dans la scène, et pourquoi son ratio est noté 4:3 paysage.`,
      `<b>Résolution du Z Fold8.</b> Samsung et les bases de données publient ` +
        `<span class="num">1848 × 2448 px</span> pour la dalle interne et ` +
        `<span class="num">1248 × 1972 px</span> pour l'écran externe. La dalle interne est ici reportée ` +
        `dans son orientation d'usage (2448 px sur la largeur physique de ${c.f.f1(c.WI.w)} mm) : le nombre ` +
        `de pixels et la densité sont identiques, seule l'orientation de lecture change.`,
      `<b>Luminosité du Z Fold8.</b> Samsung annonce <b>${c.f.f0(c.WI.peak)} nits</b> de crête sur les deux ` +
        `dalles ; GSMArena crédite la dalle interne de 3 000 nits. La valeur officielle du constructeur est ` +
        `retenue. La luminosité HDR de ce modèle n'est pas publiée, d'où la mention « non communiquée ».`,
      `<b>Rafraîchissement du Z Fold8.</b> Samsung ne publie que « 120 Hz » ; le plancher adaptatif de 1 Hz, ` +
        `propre au LTPO et annoncé sur le Fold8 Ultra, n'est pas confirmé pour ce modèle. Il est donc noté ` +
        `<span class="num">120 Hz (LTPO)</span> plutôt que 1–120 Hz.`,
      `<b>Estimations d'usage.</b> Lignes de texte, éléments de liste et caractères visibles sont modélisés ` +
        `(corps 16 dp, interligne 24 dp, ligne de liste 72 dp, largeur moyenne de caractère 8,2 dp) — ordres ` +
        `de grandeur, pas des mesures. La classe de largeur Android (compact &lt; 600 dp, medium 600–840, ` +
        `expanded ≥ 840) est en revanche un seuil réel du système.`,
    ],
  },

  pied: {
    releve:
      "Relevé établi le 13 août 2026. Les fiches techniques des trois Pixel annoncés la veille peuvent " +
      "encore être précisées par le constructeur.",
    recalcul:
      "Zones d'affichage, surfaces, dp et écarts en pourcentage recalculés dans la page à partir des " +
      "seules données officielles.",
  },

  classes: {
    compact: "Compact < 600 dp",
    medium: "Medium 600–840 dp",
    expanded: "Expanded ≥ 840 dp",
  },
  classesCourtes: { compact: "Compact < 600", medium: "Medium 600–840", expanded: "Expanded ≥ 840" },

  vide:
    "Aucun appareil sélectionné — activez-en un dans <b>Appareils</b>, tout en haut de la page.",
};
