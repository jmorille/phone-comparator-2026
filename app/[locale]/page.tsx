import Link from "next/link";
import { notFound } from "next/navigation";

import { Comparateur } from "@/components/Comparateur";
import { Riche } from "@/components/primitives";
import { Sources } from "@/components/Sources";
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

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="eyebrow">{dict.entete.eyebrow}</span>
          <h1>
            {dict.entete.titre} <em>{dict.entete.titreAccent}</em>
          </h1>
          <p className="lede">
            {dict.entete.lede(cat.reglages.selectionParDefaut.length)}
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
        {/*
          Sections 01 a 05 : elles partagent un seul etat -- dont la dalle de
          reference, que la section 02 laisse choisir -- donc un seul composant.
          La 05 en fait partie parce que ses verdicts chiffrent des ecarts.

          La 06 reste au serveur : ses notes de methode n'utilisent ni delta(), ni
          REF, ni nomRef, donc la reference ne les change pas. Le ctx qu'elle
          recoit est construit sans reference choisie, c'est-a-dire sur celle du
          catalogue. Si une note venait a citer un ecart, il faudrait la deplacer.
        */}
        <Comparateur cat={cat} locale={locale} />
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
