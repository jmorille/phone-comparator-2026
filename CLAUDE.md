# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single self-contained page, `ecrans-echelle.html` (~1300 lines), that compares the screens of four
phones drawn **at true relative scale**: Pixel 7 Pro (non-folding reference), Pixel 11 Pro Fold,
Galaxy Z Fold8 Ultra, Galaxy Z Fold8. All UI copy is in French.

The file is written as a **Claude Artifact page body**: it starts at `<title>` and has no
`<!doctype>`, `<html>`, `<head>` or `<body>` tags — those are added at publish time. Do not add them.
Everything is inline: one `<style>` block, one `<script>` block, zero dependencies, zero network
requests. There is no package.json, no build step, and no test suite.

`prompt.md` is the original French brief that produced the page. It is history, not a spec — the page
has since diverged from it deliberately (four devices instead of three, and no rumour-sourced data,
since every device is now officially announced). Don't "fix" the page back toward the brief.

## Commands

```powershell
node asciify.js                    # MANDATORY after any edit — see below
node build.js                      # writes dist/index.html — open THAT, never the source
node -e "const s=require('fs').readFileSync('ecrans-echelle.html','utf8');new Function(s.slice(s.indexOf('<script>')+8,s.indexOf('</script>')));console.log('JS OK')"
```

`npm run check` chains asciify + build. There are still no dependencies and no test suite.

**Do not preview `ecrans-echelle.html` by opening it directly.** It has no `<!doctype html>`, so a
browser renders it in **Quirks Mode** and the local result does not match the published one.
`build.js` adds the publish skeleton (doctype, `<head>` with charset/viewport/OG tags, `<body>`) and
writes `dist/index.html` — open that. It reads and writes `latin1`, refuses to build if the ASCII
invariant is broken, and refuses to build if the source has grown an `<html>`/`<body>` wrapper of its
own. Rerun it after every edit.

## Deployment

Static site on Vercel (`vercel.json`): `node build.js` → `dist/`, served as-is. No framework, no
install step. `dist/` is gitignored and rebuilt on every deploy.

## The ASCII invariant

`ecrans-echelle.html` is kept **100% ASCII bytes** so its encoding can never be misread. Accented
French text lives as `&#xE9;` HTML entities and as `\uXXXX` JS escapes. `asciify.js` enforces this.

Two ways to edit French text:

1. Type real accented characters in UTF-8, then run `node asciify.js` to convert them; or
2. Write the escapes by hand (`&#xE9;` in markup, `é` in the script) and skip the conversion.

`asciify.js` splits the file into head | `<style>` | mid | `<script>` | tail and applies the right
escaping per region. It hard-fails (before writing anything) if:

- there is more than one `<style>` or `<script>` block, or they appear out of order;
- **any non-ASCII character remains in the CSS** — HTML entities are not decoded inside `<style>`, so
  CSS must be authored in ASCII from the start. This is why the decorative comment rules use `---`
  and CSS `content:` strings use `\2192`-style CSS escapes.

The filename is hardcoded in `asciify.js`. The script is idempotent on an already-clean file.

## Architecture

### Millimetre coordinate system

This is the core idea. Nothing is laid out in pixels; everything is laid out in **millimetres of real
device**, converted by one CSS variable:

- `--ppmm` (px per mm) → `--u: calc(var(--ppmm) * 1px)`; `--dp` is one Android dp in those units.
- Every geometric value is `calc(<millimetres> * var(--u))` — plate size, screen inset, corner radius,
  the 10 mm background grid, the fixed 212 mm stage height.
- `--ppmm2` / `--u2` is a **second, independent scale** used only by the "mise en situation" scenes
  section, which sizes itself separately (`scaleScenes()`).

The main scale is deliberately **fixed**: it does not change when a device unfolds, when the layout
mode changes, or when a device is checked on, because a comparison at varying scale is meaningless.
`autoScale()` picks, once at boot and on resize, the largest scale that fits `DEFAULT_VIS` unfolded
and side by side; checking on more devices makes the stage scroll horizontally rather than shrink.
The calibration slider then lets the user push up to true 1:1 by matching a bank card, at which point
the stage scrolls horizontally. See the comment block in `autoScale()` before changing this.

**A hand-set scale wins over `autoScale()` and survives reloads.** Dragging the slider persists the
value to `localStorage` under `ecrans-echelle:ppmm`; `autoScale()` returns early whenever a stored
value exists, so neither a resize nor collapsing the fiche can clobber it. "Réinitialiser" clears the
key *before* recomputing — dropping that order makes the button a no-op. Every access goes through
`readPpmm`/`savePpmm`/`forgetPpmm`, which swallow exceptions: the page also runs as a sandboxed
Artifact, where touching `localStorage` can throw. Stored values are validated against the slider's
own `min`/`max`, so a corrupt or out-of-range entry falls back to `autoScale()`.

### Data flow

```
DEV[]  →  geom(diag, [w,h] px)  →  S (state)  →  paint()  →  DOM
                                        ↓
                                    panels()  →  sections 02 / 03 / 04
```

- `DEV[]` holds **only officially published specs** (diagonal, resolution, vendor ppi, panel tech,
  nits, chassis dimensions in mm). Nothing else is stored.
- `geom()` derives everything measurable — active display width/height in mm, area in cm², dp width
  and height, recomputed ppi — from the diagonal and the pixel resolution. Never hardcode a derived
  number; add the input and let it be computed. `REF = byId.p7p.screens.main` is the yardstick every
  percentage is measured against (`delta()`).
- `scr(d, state)` / `bod(d, state)` resolve which screen and which chassis apply to a device given the
  fold state — the only place `kind:"bar"` vs `kind:"fold"` is branched on.
- `S` is the single mutable state object (visible devices, layout mode, fold state, marks, focus,
  selected scene). Mutate `S`, then call `paint()` — never a section builder directly.
- **`panels()` is the one derivation that feeds sections 02, 03 and 04**: "for each selected device,
  its screens", yielding `[device, screenKey]` pairs. Add a device to `DEV[]` and the area bars, the
  usage scenes and the spec table all follow — there is no per-section list to keep in sync.
  `ALL_PANELS` is the same thing over the whole catalogue, used wherever a value must stay stable
  across selections (the bar-length normaliser, the spelled-out panel count).
- `paint()` runs `paintChips + layout + paintFiche` every time, but rebuilds the three heavy sections
  only when the selection actually changed — it is also called on chip *hover*, so `paintSections()`
  memoises on a key of (selection, scene state, scene content). Keep that guard if you add work to
  `paint()`.
- `DEFAULT_VIS` is the startup selection and the single source of truth for three things: the initial
  `S.vis`, what `autoScale()`/`scaleScenes()` size themselves against, and the state the animation's
  last beat returns to. Devices outside it exist everywhere but start unchecked.
- `layout()` computes absolute mm positions for every device in the stage (side-by-side or centred
  overlay), plus the offsets of the dimension rails, and writes them as CSS custom properties. It is
  the only function that positions devices.

### Device rendering

`buildDevice()` produces either a single `.plate` (bar phone) or a `.fold`: two `.leaf` halves where
the right leaf is `rotateY(-180deg)` when closed, with the `.plate.cover` crossfading against the
`.face-inner` plates. Adding `.open` to `.fold` plays the hinge. A `.plate` carries the chassis, a
nested `.scr` carries the active display area inset symmetrically inside it.

### Page sections

`#banc` (01, the scale stage) · `#surface` (02, area bars + claim sentences) · `#usage` (03, the same
mock UI — web page, 16:9 video, list, split-screen — rendered inside every screen at its real dp size)
· `#fiches` (04, spec table) · `#verdict` (05) · `#sources` (06, method notes + source list).

## Conventions

- **French output.** Decimal comma via the `f1` / `f2` / `f0` helpers, `fr-FR` grouping, and typographic
  characters as escapes: `″` (″), `−` (minus), `×` (×), `«`/`»` (« »).
- **Officially sourced data only.** The page badges itself "aucune donnée de rumeur". If you change a
  spec in `DEV[]`, update the matching entry in the `#sources` list and, where the value is contested
  or vendor-vs-database, the corresponding note in `.notes` — several of those notes exist precisely to
  document which of two conflicting figures was chosen and why.
- **Theming.** Light palette on bare `:root`, dark overrides duplicated in both
  `@media (prefers-color-scheme:dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`.
  Define new colours as tokens in all three places, never only inside the media query.
- **Reduced motion.** `rmotion` short-circuits the scripted animation to its final state, and a CSS
  media block kills all transitions. Keep both paths working when touching the `STEPS` timeline.
