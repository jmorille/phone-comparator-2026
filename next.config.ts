import type { NextConfig } from "next";

// Site entierement statique : aucune donnee n'arrive a l'execution, le catalogue
// est lu depuis data/appareils/*.json au moment de la construction. Les deux
// langues sont donc prerendues (voir generateStaticParams dans app/[locale]).
//
// La cible navigateur est declaree une seule fois, dans "browserslist"
// (package.json) : navigateurs recents uniquement, pas de retrocompatibilite.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
