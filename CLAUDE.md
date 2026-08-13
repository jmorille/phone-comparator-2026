# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js 16 application (App Router, TypeScript, React 19) that compares phone screens **at true
relative scale**. The UI ships in **French and English**; the device catalogue lives in
`data/appareils/*.json`, one file per phone, so the comparison is extended by adding a file rather
than by editing code.

It began life as a single self-contained Claude Artifact page (`ecrans-echelle.html`, ~1300 lines of
imperative DOM code kept 100 % ASCII). That page and its build chain — `build.js`, `asciify.js` —
were removed when the app was ported. **The ASCII invariant no longer exists**: every file is UTF-8
and accented characters are typed directly. If you find advice about `asciify.js` or `&#xE9;` entities
anywhere, it is stale. `prompt.md` is the original French brief, kept as history, not as a spec.

Package manager is **pnpm**. Build target is **modern browsers only** — one `browserslist` in
`package.json`, no legacy transpilation.

## Commands

```powershell
pnpm dev            # serveur de developpement
pnpm build          # construction de production ; valide aussi le catalogue (voir plus bas)
pnpm start          # sert la construction ; PORT=3210 pour changer de port
pnpm types          # tsc --noEmit
pnpm check          # types + build
```

There is no test suite. `pnpm build` is the verification: it type-checks, runs `chargerCatalogue()`
for both locales, and prerenders `/fr` and `/en`.

## The millimetre coordinate system

Unchanged from the original page, and still the core idea. Nothing is laid out in pixels; everything
is laid out in **millimetres of real device**, converted by one CSS variable:

- `--ppmm` (px per mm) → `--u: calc(var(--ppmm) * 1px)`; `--dp` is one Android dp in those units.
- Every geometric value is `calc(<millimetres> * var(--u))` — plate size, screen inset, corner radius,
  the 10 mm background grid, the fixed 212 mm stage height.
- `--ppmm2` / `--u2` is a **second, independent scale** used only by the "mise en situation" section.
  Inside that section each device wrapper redefines `--u: var(--u2)`, so components can always write
  `var(--u)` and get the right scale for their context.

Both variables are written onto `document.documentElement` from React state in `Comparateur.tsx`.

The main scale is deliberately **fixed**: it does not change when a device unfolds, when the layout
mode changes, or when a device is checked on, because a comparison at varying scale is meaningless.
`echelleAuto()` picks the largest scale that fits `selectionParDefaut` unfolded and side by side;
checking on more devices makes the stage scroll horizontally rather than shrink. See the comment
block in `lib/scene.ts` before changing this.

**A hand-set scale wins over `echelleAuto()` and survives reloads.** Dragging the slider persists the
value to `localStorage` under `ecrans-echelle:ppmm`; `recalculerBanc()` returns early whenever a
stored value exists. "Réinitialiser" clears the key *before* recomputing — dropping that order makes
the button a no-op. Every access goes through `lireEchelle`/`ecrireEchelle`/`oublierEchelle`, which
swallow exceptions: `localStorage` can throw in private browsing or a sandboxed iframe.

## Architecture

```
data/appareils/*.json  ─┐
data/reglages.json     ─┴─> chargerCatalogue()  ->  Catalogue  ─┬─> page.tsx (serveur) ─> Verdicts, Sources
                            (lib/catalogue.ts)                  │
                                                                └─> Comparateur (client)
                                                                      EtatUI ─> disposer() ─> Banc
                                                                             └─> panneaux() ─> 02 / 03 / 04
```

### Where the data lives

- **`data/appareils/<id>.json`** — one device. Only officially published specs: diagonal, resolution,
  vendor ppi, panel tech, nits, chassis dimensions in mm, weight, plus the device's own `sources[]`.
  The filename must equal the `id`. `order` fixes the display rank everywhere.
- **`data/reglages.json`** — the reference device (the 100 % of every percentage), the startup
  selection, the scale bounds, and the sources that belong to no single device.
- Localisable strings are objects: `{ "fr": "…", "en": "…" }`. Every locale is required; a missing one
  fails the build with the file and field named.

### Deriving, never storing

`lib/geometrie.ts` computes everything measurable — active width/height in mm, area in cm², dp width
and height, recomputed ppi — from the diagonal and the pixel resolution alone. **Never hardcode a
derived number**; add the input and let it be computed.

`lib/types.ts` holds the contract plus the total derivations. `Appareil` is a **discriminated union**
on `kind`: a `"bar"` has no inner screen and no unfolded chassis, and the compiler knows it, which is
what makes `scr()` and `bod()` total — no optional access or non-null assertion anywhere in the
components. A `Panneau` carries its resolved `Ecran` alongside `{d, k}`, so sections never reindex
`screens`.

`panneauxDe()` — "for each device, its panels" — is the one derivation feeding sections 02, 03 and 04.
Add a device and the area bars, the usage scenes and the spec table all follow; there is no
per-section list to keep in sync. `cat.tousPanneaux` is the same thing over the whole catalogue, used
wherever a value must stay stable across selections (the bar-length normaliser, spelled-out counts).

### State and layout

`components/etat.ts` defines `EtatUI`, the single mutable state object (visible devices, layout mode,
fold state, marks, focus, selected scene, fiche). `Comparateur.tsx` owns it; mutate it and the render
follows. The animation's beats are `TEMPS` in the same file — mechanics and durations only, since
captions are translated and come from `dict.banc.etapes(ctx)`. **The two arrays must stay the same
length.**

`lib/scene.ts` `disposer()` computes absolute mm positions for every device plus the offsets of the
dimension rails. It is **pure** — no DOM reads; the one browser measurement, the container width, is
passed in as `largeurPx`, and is `null` until measured so the server and the first client render
agree (no hydration mismatch). It is the only function that positions a device.

Dimension rails stagger over the **visible** devices, with a step that tightens as the selection
grows. The original page indexed a fixed four-entry `ROWS` table by catalogue position, which
produced `--woff: NaN` for the fifth and sixth devices once the catalogue grew past four.

## Internationalisation

- Routes are `/[locale]`, `LOCALES = ["fr", "en"]`, both prerendered by `generateStaticParams`.
  `proxy.ts` (Next 16's replacement for `middleware.ts`) negotiates `Accept-Language` at `/`.
- `i18n/types.ts` is the contract: a `Dictionnaire` interface that `i18n/fr.ts` and `i18n/en.ts` must
  both satisfy. **Adding a key breaks both files until they are filled** — that is the point.
- Prose that quotes figures is a function of `Ctx` (`i18n/index.ts`), which hands it the measured
  panels and the formatters of its language. The prose never recomputes.
- `Ctx` names devices by id (`fold`, `sam`, `sam8`, `p11p`, `p11xl`). Adding a device is free;
  **removing one that the editorial prose cites fails the build** with a message pointing at `i18n/`.
  Sections 01–04 are fully generic — only the claims, verdicts and method notes name devices.
- The dictionary contains functions, so it cannot cross the server/client boundary as a prop. Client
  components import it directly and rebuild `Ctx` from the catalogue they receive. Keep `node:fs` out
  of anything a client component imports — that is why `exiger*()` lives in `lib/types.ts` and not in
  `lib/catalogue.ts`.

## Conventions

- **Number formatting is manual, never `toLocaleString`.** `lib/format.ts` builds the separators by
  hand because Intl's thousands separator depends on the engine's ICU version, and a server and a
  browser that disagree produce a hydration error. French uses a narrow no-break space and a decimal
  comma, English a comma and a period; French puts a no-break space before `%`, English does not.
  Typographic characters are literal: `″`, `−` (true minus), `×`, `«` `»`.
- **Officially sourced data only.** The page badges itself "aucune donnée de rumeur". A device's
  sources live in its own JSON file, so changing a spec and forgetting its source is structurally
  harder. Contested or vendor-vs-database figures are documented in `dict.sources.notes`.
- **Theming.** Light palette on bare `:root`, dark overrides duplicated in both
  `@media (prefers-color-scheme:dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`.
  Define new colours as tokens in all three places, never only inside the media query. The per-device
  `--c-<id>` tokens are **generated** from JSON in `app/[locale]/layout.tsx` and therefore satisfy this
  by construction — do not add them to `globals.css`.
- **Reduced motion.** `jouer()` short-circuits the scripted animation to its final state, and a CSS
  media block kills all transitions. Keep both paths working when touching `TEMPS`.
- **Prose carries markup.** Dictionary strings contain `<b>`, `<span class="num">`, `<sub>`; they are
  rendered through `<Riche>`. This content is written in the repo and never comes from a visitor.

## Adding a device

1. Drop `data/appareils/<id>.json` next to the others — copy the closest existing file. Set `order`,
   both `hue` values, and every `{fr, en}` string. Include at least one entry in `sources[]`.
2. `pnpm build`. The loader names the file and the field for anything missing or malformed.
3. Nothing else. The chips, the stage, the area bars, the usage scenes and the spec table all derive
   from the catalogue. Only mention the device in `i18n/` if you want editorial prose about it.

## Deployment

Vercel, framework `nextjs` (`vercel.json` keeps only the security headers). Both locales are
prerendered as static HTML; `proxy.ts` runs for the root redirect.
