import type { Ctx, Dictionnaire } from "@/i18n";
import type { Catalogue, Locale } from "@/lib/types";

import { Riche } from "./primitives";

/**
 * Les sources vivent dans le fichier de l'appareil qu'elles documentent, et
 * remontent ici dans l'ordre du catalogue. Ajouter un appareil apporte donc ses
 * references : il n'y a plus de liste separee a tenir en phase avec les donnees.
 */
export function Sources({
  cat,
  ctx,
  dict,
  locale,
}: {
  cat: Catalogue;
  ctx: Ctx;
  dict: Dictionnaire;
  locale: Locale;
}) {
  const liste = [
    ...cat.appareils.flatMap((d) => d.sources),
    ...cat.reglages.sourcesGenerales,
  ];

  return (
    <section className="sec" id="sources">
      <div className="wrap" style={{ display: "grid", gap: 26 }}>
        <div className="sec-head" style={{ margin: 0 }}>
          <span className="eyebrow">{dict.sources.eyebrow}</span>
          <h2>{dict.sources.titre}</h2>
        </div>

        <ul className="notes">
          {dict.sources.notes(ctx).map((n, i) => (
            <Riche key={i} tag="li" html={n} />
          ))}
        </ul>

        <div className="src-list">
          {liste.map((src) => (
            <div className="src" key={src.url + src.who}>
              <span className="who">{src.who}</span>
              <span className="what">{src.what[locale]}</span>
              <a className="num" href={src.url} rel="noreferrer">
                {new URL(src.url).hostname.replace(/^www\./, "")}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
