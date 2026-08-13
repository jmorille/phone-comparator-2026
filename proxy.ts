import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_DEFAUT } from "@/i18n";
import { LOCALES, type Locale } from "@/lib/types";

/**
 * La racine « / » ne rend rien : elle redirige vers la langue du visiteur. Toute
 * autre URL porte déjà son préfixe de langue et passe sans être touchée.
 */
function negocier(entete: string | null): Locale {
  if (!entete) return LOCALE_DEFAUT;
  const preferences = entete
    .split(",")
    .map((morceau) => {
      const [etiquette = "", ...params] = morceau.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { langue: etiquette.toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { langue } of preferences) {
    const base = langue.split("-")[0];
    const trouvee = LOCALES.find((l) => l === base);
    if (trouvee) return trouvee;
  }
  return LOCALE_DEFAUT;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const dejaLocalisee = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (dejaLocalisee) return NextResponse.next();

  const locale = negocier(req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // ni les ressources de Next, ni les fichiers servis tels quels
  matcher: ["/((?!_next|favicon\\.ico|icon\\.svg|.*\\.[\\w]+$).*)"],
};
