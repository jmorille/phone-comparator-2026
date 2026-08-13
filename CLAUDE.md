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
pnpm build          # construction de production ; verifie Node et valide le catalogue
pnpm start          # sert la construction ; PORT=3210 pour changer de port
pnpm types          # tsc --noEmit
pnpm node           # controle que la version de Node satisfait "engines.node"
pnpm check          # types + build
```

```bash
# depuis Git Bash, pas PowerShell : "bash" y resout vers WSL, ou node est absent du PATH
PORT=3312 bash scripts/fumee.sh   # test de fumee sur la construction
node scripts/instantane.mjs       # assemble instantane/ : les deux langues + leurs actifs
```

There is no unit test suite. Verification is three layers, and CI runs all three:

1. `pnpm types` — the dictionary contract and the discriminated device union.
2. `pnpm build` — runs `chargerCatalogue()`, so **it is also the catalogue validator**, and prerenders
   `/fr` and `/en`.
3. `scripts/fumee.sh` — boots the built server and asserts that `/` negotiates the language, that both
   locales are served with their own `lang` attribute, that the table title reflects the startup
   selection in each language, and that numbers switch separator (`111,5` vs `111.5`). Its patterns
   are deliberately ASCII so they do not depend on the runner's locale.

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
data/reglages.json     ─┴─> chargerCatalogue()  ->  Catalogue  ─┬─> page.tsx (serveur) ─> Sources (06)
                            (lib/catalogue.ts)                  │
                                                                └─> Comparateur (client)
                                                                      EtatUI ─> disposer() ─> Banc (01)
                                                                             ├─> panneaux() ─> 02 / 03 / 04
                                                                             └─> resoudreRef() ─> Ctx ─> Verdicts (05)
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

`REPERES` in `lib/types.ts` is the single source of truth for which cotes the stage can draw —
`w`, `h`, `d` (diagonal), `a` (area), `e` (thickness). The array gives the chip order; `Repere`
constrains `EtatUI.marks` (`Marques = Record<Repere, boolean>`) *and* `dict.ctl.marques`. Adding a
cote is one array entry: the two dictionaries then stop compiling until they translate it, and
`marquesToutes()` in `components/etat.ts` keeps the all-on / all-off literals of `etatInitial` and
`TEMPS` from having to be rewritten.

The `Tranche` band under the stage draws each device **edge-on** — `body.w` wide by `body.d` thick,
at the same `--u`, on a shared baseline, at the same `x` as the device above it.
Its height reserve, `TRANCHE_MM`, is a **constant** in `echelleAuto()`'s budget — it does not shrink
when the band is toggled off, for the same reason the scale itself is fixed. Toggling the band gives
back screen space, never scale.

`.prof` is the **cote**, not the drawing: its box is exactly `bod(d, etat)`, which is what carries the
mm label and what moves. What paints is a `.sect` inside it — one for a bar, two hinged leaves for a
foldable, so the cote stays measurable while the drawing folds.

### The hinge, and why the closed profile is exact

A foldable's profile is two leaves pivoting at the crease. **The pivot sits at half the *published*
closed thickness** above the baseline, so a 180° rotation lands the upper leaf at exactly `closed.d` —
10.1 mm for the Fold, not the 10.0 that stacking two 5.0 mm leaves would give. The hinge gap is
reproduced, not ignored. Likewise the pivoting leaf is longer than half the open width and overhangs
the pivot by `closed.w − open.w/2`: open it covers exactly `open.w` (the overhang overlaps invisibly at
the crease), closed it covers exactly `closed.w` (the overhang falls on the hinge side, where the spine
is). Both end states are therefore right to the millimetre, like the single capsule they replaced.

**Measure this if you touch it.** Rendered against published data at 2.1 px/mm, all seven devices in
both fold states agree to within 0.011 mm in both views — sub-pixel, i.e. rounding in
`getBoundingClientRect` alone. Chassis heights do not change when a book-fold closes (155.2 mm for the
Fold either way); the number that changes is the thickness. Scale respect is the point of this app, so
a hinge change that shifts a silhouette by a visible fraction of a millimetre is a regression even if
it looks better.

Mid-flight the leaf stands its full length — ~76 mm, far beyond the band's few millimetres of reserve.
`.tranche` therefore carries `z-index:60`, above every device (10–17, and 40 when focused), so the
closing leaf passes **in front** of the phones: an object being shut passes in front of what is behind
it, and that is what makes the gesture read.

### Sequencing: the fold and the layout do not move together

A foldable closes **before** the scene tightens, and the scene spreads **before** it opens. Otherwise
devices pack onto a leaf still in flight, or a leaf unfolds across its neighbour.

This lives in **JavaScript, not CSS**. `useRetarde` in `Comparateur` reads `s.etat` twice with
different lags: `pliDispo` (fed to `disposer()` — positions, widths, cotes) waits `CHARNIERE_MS` when
closing, and `pliCharniere` (fed to the leaves) waits `DISPOSITION_MS` when opening. `s.etat` itself
stays immediate, so the chip responds at once.

Two attempts failed before this one, both worth not repeating:

- **`transition-delay` armed from React arrives too late.** A `data-geste` attribute toggled for the
  duration of the gesture computed correctly — `getComputedStyle` reported `1.8s` — while
  `getAnimations()` showed the running transition carrying delay `0`. React commits the new positions
  before the attribute lands, and by then the transition already exists. Setting the state *during
  render* rather than in an effect did not fix it either.
- **Keying the delay on the fold state itself** stalls everything else: while closed, checking a device
  on would wait 1.8 s for no reason. The delay has to belong to the gesture, not to the state.

`CHARNIERE_MS` / `DISPOSITION_MS` in `components/etat.ts` are the twins of `--hinge` / `--dur` in
`globals.css` — **move them together.** `GESTE_MS` is their sum, and the `TEMPS` beat that unfolds is
derived from it rather than typed, so lengthening the hinge cannot leave the narration cutting the
gesture off mid-swing. Reduced motion drops the lag to zero in `useRetarde`: staggering a gesture whose
transitions are instant is a frozen screen, not a gentler movement.

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
- **The 100 % is the reader's choice, so prose must say whose it is.** `EtatUI.ref` holds a
  `CleDalle` and section 02 lets the reader point it at any panel on stage; `resoudreRef()` resolves
  it. Three rules follow, and the compiler enforces none of them:
  - A sentence that quotes `c.delta()` must name the reference through `c.nomRef`, never in
    hardcoded text.
  - A sentence about the **Pixel 7 Pro itself** — its 2022 yardstick role, its curved edges, the
    four-years-of-bars verdict — must compute with `c.deltaP7()` / `c.P7`, which do not move. Writing
    `c.delta()` there silently rewrites the argument when the reader changes the reference.
  - A sentence comparing panel *X* to the reference must use `c.ecartCite(X)`, not `c.delta(X)` plus
    `c.nomRef`. When the reader makes *X* itself the reference, the naive form renders
    "+0,0 % vs Galaxy Tab S10+" inside a verdict about the Tab S10+. `ecartCite()` falls back to the
    Pixel 7 Pro in exactly that case.

  `resoudreRef()` keeps the catalogue reference valid **even unchecked** — the original page used the
  Pixel 7 Pro as the yardstick without it being on stage, and the lede still says so. An explicit
  reader choice, by contrast, does not survive unchecking its device. That is why the picker also
  offers the current reference when it is off stage, marked `dict.surface.horsScene`: otherwise no
  chip would look active while a reference was plainly in force.

  Section 05 (`Verdicts`) is rendered from `Comparateur`, not `page.tsx`, because its figures depend
  on that state. Section 06 (`Sources`) stays on the server — its notes use neither `delta()`, `REF`
  nor `nomRef`. Adding a note that quotes a difference means moving it too.
- **No string states how large the catalogue is.** Not the page title, not the meta description, not
  the lede, not a verdict. `meta.titre` and `entete.titre` are plain strings, not `titre(n)`; the
  title is "Les écrans à l'échelle", never "Sept écrans". Deriving the count was not enough: it kept
  the page truthful but still moved the title, the description and the search snippet on every
  addition, and the same habit had produced hardcoded "des six" elsewhere that went quietly false.
  Counts that describe the **user's current selection** stay — `tableau.titre(n)` still says "Les six
  dalles" — because growing the catalogue cannot make those wrong.

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
- **Reduced motion.** Three paths, all of which must keep working: `jouer()` short-circuits the
  scripted animation to its final state, `useRetarde` drops the fold sequencing lag to zero, and a CSS
  media block kills every transition **duration and delay** — the delay matters, since the fold's
  cross-fades carry one and an instant-but-postponed transition is still movement.
- **Prose carries markup.** Dictionary strings contain `<b>`, `<span class="num">`, `<sub>`; they are
  rendered through `<Riche>`. This content is written in the repo and never comes from a visitor.

## Adding a device

1. Drop `data/appareils/<id>.json` next to the others — copy the closest existing file. Set `order`,
   both `hue` values, and every `{fr, en}` string. Include at least one entry in `sources[]`.
2. `pnpm build`. The loader names the file and the field for anything missing or malformed.
3. Nothing else. The chips, the stage, the area bars, the usage scenes and the spec table all derive
   from the catalogue. Only mention the device in `i18n/` if you want editorial prose about it.

**Two things step 3 does not cover, both learned the hard way when the Galaxy Tab S10+ was added.**

*A device that breaks a record falsifies prose that no compiler checks.* The editorial claims and
verdicts hold superlatives — "the largest display", "the widest of the foldables". A new device that
beats one of them makes it silently false; the build stays green. Before adding one, grep `i18n/` for
`plus grand|plus large|plus petit|largest|widest|smallest` and check each hit against the newcomer.
The fix is usually to narrow the claim to the class it is really about (a foldable, a phone) rather
than to delete it.

*The stage is 212 mm tall and does not grow.* A device taller than that is clipped — `disposer()`
centres it on a fixed canvas. Enter it in the orientation the vendor specifies; for tablets that is
landscape, which is what makes the Tab S10+ fit at 185.4 mm. A genuinely taller device needs
`HAUTEUR_MM` raised, which rescales the whole comparison for everyone.

Also worth knowing: `maxArea` normalises the area bars over the **whole catalogue**, not the
selection. A device with a much larger panel shortens every other bar, even while it is unchecked.
That is by design — bars must stay comparable across selections — but it does change the existing
page, so say so in `dict.surface.intro` rather than letting it look like a regression.

## Deployment

Vercel, framework `nextjs`. Both locales are prerendered as static HTML; `proxy.ts` runs for the root
redirect.

`<Analytics />` from `@vercel/analytics/next` sits in the root layout's `<body>`. It is cookieless and
stores no persistent identifier, and it injects nothing until the site is deployed — locally, and in
the offline snapshot, it is inert. It is the only runtime dependency outside the framework; the page
still makes no other network request.

`vercel.json` states `"outputDirectory": ".next"` even though that is the Next.js default. It is not
decoration: the project was created for the old static chain and its dashboard still carried
`Output Directory = dist`. The Next build succeeded and Vercel then failed looking for `dist/`.
Settings in `vercel.json` take precedence over the dashboard, so declaring it here pins the correct
value in the repository instead of leaving it to a setting nobody can see from the code.

Vercel deploys from git and is **not** driven by the workflows below — CI verifies, Vercel ships.

## CI and releases

`.github/workflows/ci.yml` runs on every branch: install with `--frozen-lockfile` (so a stale
`pnpm-lock.yaml` fails), types, build, smoke test, and uploads the snapshot as an artifact for 7 days.
A pull request opened from this repository is skipped, since the push on its branch already covers it;
only fork PRs trigger the event.

`.github/workflows/release.yml` runs on a `vX.Y.Z` tag. It **refuses to publish if the tag and
`package.json`'s `version` disagree** — bump the version in the same commit you tag. It then runs the
same three verification layers, assembles the snapshot, and creates the GitHub Release with
auto-generated notes plus `instantane-vX.Y.Z.tar.gz`.

That archive is the two prerendered locales and their `_next/static` assets, served from any file
server and fully interactive (React hydrates from those same assets). It is an **archive, not the
deployable**: `proxy.ts` does not run behind a static server, so `index.html` redirects to French
instead of negotiating.

## Node 24 minimum

Declared in three places, each with a distinct job — and enforced in exactly one:

- `engines.node: ">=24"` — what Vercel reads to pick its runtime.
- `.nvmrc` — what CI and `nvm` read. The workflows use `node-version-file: .nvmrc`, so the version is
  never repeated in YAML. pnpm's own version comes from `packageManager`.
- `scripts/verifier-node.mjs`, wired into `pnpm build` — **the only one that actually fails.**

That last one is not belt-and-braces. `engines` is advisory: npm ignores it without `--engine-strict`,
and **pnpm 11 no longer reads `engine-strict` (or any other pnpm setting) from `.npmrc`** — it emits
`[WARN] Unsupported engine` and installs anyway. Verified: `pnpm config list` returns only registry
keys. That is why the repository has no `.npmrc`; one existed briefly and was entirely inert.

`target`/`lib` are `ES2024`, which both Node 24 and the `browserslist` range cover. Nothing is
transpiled down to legacy on either side.

Do not read `target` as the browser contract. `noEmit` is `true` and Next transpiles with Turbopack
from `browserslist`, so **`target`/`lib` never touch what ships** — they set the *authoring* surface,
i.e. which globals the checker will let you name. The browser contract is `browserslist`, alone. The
consequence is the trap: `lib` admitting a method is no evidence a browser has it, and client code
reaching for one Turbopack will not polyfill breaks at runtime, silently, in whatever old Safari the
range still covers. Server-only code has no such ceiling — Node 24 is the floor there.

`ES2024` was also the hard ceiling of TypeScript 5.9, which had no `es2025` at all. TypeScript 7 does
(`es2025`, plus `es2025.collection` / `.iterator` / `.promise` / `.regexp`), so the ceiling is now a
choice rather than a limit.

### Why the floor is 24 and not higher

Vercel is the ceiling, and it is a hard one. Its build and function runtimes stop at **24.x** (`24.x`
default, then `22.x`, `20.x`); it resolves `engines.node` against that list, and **a range no entry
satisfies is a build error**, not a fallback. `">=26"` therefore fails the deploy outright — before
`verifier-node.mjs` ever runs, so its message never appears to explain why.

Local Node may well be newer (26 works fine; the source uses no API past 24). That is not a reason to
raise the floor: `engines.node` is read by the platform that has to honour it. **Raise it only once
Vercel lists that major**, and move `.nvmrc` and `@types/node` with it — typing against a Node the
runtime does not provide lets code compile that crashes on deploy. CI is indifferent either way: it
reads `.nvmrc` and installs whatever it is told.
