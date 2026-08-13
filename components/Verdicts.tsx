import type { Ctx, Dictionnaire } from "@/i18n";
import { teinte } from "@/lib/types";

import { Riche, vars } from "./primitives";

export function Verdicts({ ctx, dict }: { ctx: Ctx; dict: Dictionnaire }) {
  const verdicts = dict.verdictSection.verdicts(ctx);
  const nuances = verdicts.filter((v) => v.nuance).length;

  return (
    <section className="sec" id="verdict">
      <div className="wrap">
        <div className="sec-head">
          {/* le sur-titre compte ce qu'il y a reellement dans la liste */}
          <span className="eyebrow">
            {dict.verdictSection.eyebrow(verdicts.length - nuances, nuances)}
          </span>
          <h2>{dict.verdictSection.titre}</h2>
        </div>
        <div className="verdicts">
          {verdicts.map((v) => (
            <div key={v.q} className="verdict" style={vars({ "--dc": teinte(v.deviceId) })}>
              <span className="q">{v.q}</span>
              <span className="a">
                <span className="sw" />
                {v.a}
              </span>
              <Riche className="w" html={v.w} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
