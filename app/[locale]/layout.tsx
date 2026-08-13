import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import "../globals.css";

import { dictionnaire, estLocale } from "@/i18n";
import { chargerCatalogue } from "@/lib/catalogue";
import { LOCALES, type Catalogue } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const dict = dictionnaire(locale);
  const { titre, description } = dict.meta;

  return {
    title: titre,
    description,
    openGraph: { type: "website", title: titre, description, locale },
    twitter: { card: "summary", title: titre, description },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  };
}

/**
 * Une couleur par appareil, ecrite dans les trois blocs de theme que la page
 * utilise (clair, systeme sombre, sombre force). C'est la convention du projet :
 * une couleur jamais definie dans un seul bloc. Elle est ici tenue par
 * construction, puisque les trois sont generes d'un meme tableau.
 */
function jetonsCouleurs(cat: Catalogue): string {
  const bloc = (mode: "light" | "dark") =>
    cat.appareils.map((d) => `--c-${d.id}:${d.hue[mode]}`).join(";");
  const clair = bloc("light");
  const sombre = bloc("dark");
  return (
    `:root{${clair}}` +
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${sombre}}}` +
    `:root[data-theme="dark"]{${sombre}}`
  );
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <head>
        <meta name="color-scheme" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: jetonsCouleurs(chargerCatalogue()) }} />
      </head>
      <body>
        {children}
        {/*
          Vercel Analytics. Sans cookie et sans identifiant persistant, il ne
          collecte donc rien qui suive un visiteur d'une visite a l'autre. Le
          composant n'injecte son script qu'une fois deploye : en local comme
          dans l'instantane hors ligne, il ne fait rien.
        */}
        <Analytics />
      </body>
    </html>
  );
}
