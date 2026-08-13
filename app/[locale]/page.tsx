import Link from "next/link";
import { notFound } from "next/navigation";

import { Comparateur } from "@/components/Comparateur";
import { Riche } from "@/components/primitives";
import { Sources } from "@/components/Sources";
import { Verdicts } from "@/components/Verdicts";
import { contexte, dictionnaire, estLocale, langues } from "@/i18n";
import { chargerCatalogue } from "@/lib/catalogue";
import type { Locale } from "@/lib/types";

function SelecteurLangue({ courante, libelle }: { courante: Locale; libelle: string }) {
  return (
    <nav className="lang" aria-label={libelle}>
      {langues.map((l) => (
        <Link
          key={l.code}
          href={`/${l.code}`}
          hrefLang={l.code}
          aria-current={l.code === courante ? "true" : undefined}
        >
          {l.code}
        </Link>
      ))}
    </nav>
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const cat = chargerCatalogue();
  const dict = dictionnaire(locale);
  const ctx = contexte(cat, locale);

  const nbAppareils = cat.appareils.length;
  const nbDalles = cat.tousPanneaux.length;

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="eyebrow">{dict.entete.eyebrow}</span>
          <h1>
            {dict.entete.titre(nbAppareils)} <em>{dict.entete.titreAccent}</em>
          </h1>
          <p className="lede">
            {dict.entete.lede(nbDalles, cat.reglages.selectionParDefaut.length)}
          </p>
          <div className="meta-row">
            <span className="badge ofc">
              <span className="dot" />
              <Riche html={dict.entete.badgeOfficiel} />
            </span>
            <span className="badge calc">
              <span className="dot" />
              <Riche html={dict.entete.badgeCalcule} />
            </span>
            <span className="badge">{dict.entete.badgeRumeur}</span>
            <SelecteurLangue courante={locale} libelle={dict.entete.choixLangue} />
          </div>
        </div>
      </header>

      <main>
        {/* sections 01 a 04 : elles partagent un seul etat, donc un seul composant */}
        <Comparateur cat={cat} locale={locale} />
        <Verdicts ctx={ctx} dict={dict} />
        <Sources cat={cat} ctx={ctx} dict={dict} locale={locale} />
      </main>

      <footer className="end">
        <div className="wrap">
          <div>{dict.pied.releve}</div>
          <div className="num">{dict.pied.recalcul}</div>
        </div>
      </footer>
    </>
  );
}
