# Gallery design system (`gallery.config.json`)

Single source of truth for poster grounds, layout, motion, graphics, fonts, and title fitting. **Theme colors and typography** live in `assets/css/site/01-tokens.css` (light + dark primaries). Loaded at startup by `lib/gallery-config.js` and applied as CSS custom properties + a small injected stylesheet for per-ground tokens.

## Applying edits

1. Run the app with **`npm start`** and open **http://localhost:3000** (not `file://` — the config is loaded via `fetch`).
2. **Save** `config/gallery.config.json`.
3. **Switch away from the browser tab and back** (or change to another app and return). The tab refocus reloads config and redraws poster patterns.
4. Have a **`.md` file open in the reader** — landing page alone does not show posters or glyph patterns.

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `theme.graphics.glyph.opacity` → `0.2` | Much stronger background letters |
| `theme.graphics.typePattern.roll.noneProbability` → `0` | Every poster gets a pattern (none were skipped before) |
| `theme.graphics.typePattern.shape.patternTypes` → `["line"]` only | Only straight-line letter paths |
| `theme.graphics.typePattern.geometry.repeatsMin` / `Max` → `4` / `4` | Fewer, larger gaps between letters |
| `assets/css/site/01-tokens.css` `--color-ground-*` | Poster surface + foreground palette (edit primaries here) |
| `grounds.*.glyph` / `heroGlyph` | Per-ground glyph overrides only |

If nothing changes: hard-refresh the page (Cmd+Shift+R), re-drop your `.md` file, and confirm the JSON is valid (a parse error keeps the previous config).

**Ground rules, APCA targets, OKLCH usage:** [`docs/DESIGN.md`](../docs/DESIGN.md).

**Reload:** save the file, then refocus the browser tab (or refresh). Changes apply without rebuilding.

---

## Theme colors & typography (`assets/css/site/01-tokens.css`)

Edit CSS custom properties — not `gallery.config.json`.

| Token | Role |
|-------|------|
| `--color-paper`, `--color-ink`, `--color-ink-soft`, `--color-ink-muted` | Light page chrome |
| `--color-accent`, `--color-accent-bright` | Light accent |
| `--color-dark-paper`, `--color-dark-ink`, … | Dark mode primaries |
| `--font-size-body`, `--line-height-body`, `--line-height-prose`, … | Typography primaries |
| `--body-size`, `--ink`, `--paper`, … | Semantic aliases used in components |

Dark mode semantics are applied in `assets/css/reader/07-theme-dark.css`.

---

## `theme` — layout, motion, graphics (config)

### `theme.layout`

| Key | Role |
|-----|------|
| `measure` | Prose max line length (`65ch`) |
| `posterWidth` | Poster card width (`42rem`) |
| `edgeStepMix` | How much black mixes into ground edges (0–0.4) |
| `pad` | Horizontal page padding |
| `scrollOffset` | Scroll-padding for sticky header |

### `theme.hero`

Collection hero (top of document) — values can be **semantic** or hex:

| Key | Example |
|-----|---------|
| `display` | `"red"` |
| `body` | `"inkSoft"` |
| `muted` | `"inkMute"` |

Semantic names: `paper`, `ink`, `inkSoft`, `inkMute`, `red`, `redBright`.

### `theme.motion`

| Key | Role |
|-----|------|
| `cardHoverEase` | Card hover easing |
| `cardHoverDuration` | Card hover duration |
| `revealDuration` | Scroll-reveal fade/slide duration |
| `revealEase` | Scroll-reveal easing |
| `shutterDuration` | Shutter intro duration |
| `shutterEase` | Shutter intro easing |

### `theme.graphics` — poster decoration

Poster graphics are grouped by feature. **`lib/resolve-graphics-config.js`** flattens groups at runtime; legacy flat keys still work.

```
theme.graphics
├── glyph              … shared pattern ink (CSS tokens)
├── imageHalftone      … prose photo halftone (independent)
├── imageIsometric     … isometric prose image frame (opt-in in markdown)
├── heroGlyph          … mega background glyph (one per poster roll)
│   ├── roll
│   ├── text
│   ├── layout
│   ├── appearance
│   └── accessibility
└── typePattern        … mini canvas patterns
    ├── roll
    ├── symbol
    ├── blend
    ├── shape
    ├── geometry
    ├── placement
    └── appearance
```

#### `glyph` — shared pattern ink

| Key | Default | Role |
|-----|---------|------|
| `color` | `"display"` | Default pattern letter color when a ground omits `glyph.color` |
| `opacity` | `0.07` | Default pattern strength when a ground omits `glyph.opacity`; also used when `typePattern.appearance` omits `opacityMin`/`opacityMax` |

Per-ground overrides live on each entry in `grounds` (see below). Legacy flat keys `glyphPatternColor` / `glyphPatternOpacity` still merge into the global default.

#### `imageHalftone` — prose photos

Independent of glyph patterns. Object under `theme.graphics.imageHalftone`. Defaults in `lib/image-halftone-config.js`.

| Key | Default | Role |
|-----|---------|------|
| `enabled` | `true` | Master toggle |
| `dotPx` | `5` | Dot spacing in CSS px (lower = finer) |
| `contrast` | `1.2` | Tone punch / dot density (higher = less washed out) |
| `saturation` | `1.35` | Color boost per dot |
| `paper` | `"surface"` | Solid fill behind dots: `surface` (poster ground), `paper` (page bg), or hex |
| `angleDeg` | `15` | Screen angle in degrees |
| `pattern` | `"stagger"` | `stagger` \| `grid` \| `line` |

Legacy flat keys (`imageHalftoneDotPx`, etc.) still merge if present.

#### `imageIsometric` — isometric prose images

Opt in per image via markdown title: `![](path "isometric")`. Defaults in `lib/image-iso-config.js`.

| Key | Default | Role |
|-----|---------|------|
| `perspective` | `1400` | 3D perspective distance (px). Set `false`, `"none"`, or `0` to disable |
| `perspectiveOrigin` | `"50% 42%"` | Vanishing-point anchor |
| `rotateX` | `7` | Tilt on X axis (deg) |
| `rotateY` | `-16` | Tilt on Y axis (deg) |
| `rotateZ` | `-1.5` | Skew on Z axis (deg) |
| `solidShadowX` | `10` | Hard shadow offset X (px) |
| `solidShadowY` | `14` | Hard shadow offset Y (px) |
| `softShadowY` | `28` | Soft shadow offset Y (px) |
| `softShadowBlur` | `52` | Soft shadow blur (px) |
| `softShadowSpread` | `-16` | Soft shadow spread (px) |
| `softShadowOpacity` | `0.24` | Soft shadow strength (`0`–`1`) |
| `stroke` | `"#000000"` | Border + solid shadow color (always black by default) |

#### `heroGlyph` — mega background glyph

Random alternative to mini `typePattern` on a poster. Defaults in `lib/poster-hero-glyph.js`. Uses **`typePattern.symbol`** + **`typePattern.blend`**.

| Group | Keys | Role |
|-------|------|------|
| **`roll`** | `probability` (`0.22`) | Chance per poster (`0`–`1`) |
| **`color`** | semantic or hex | Fill before blend. `"glyph"` (default) follows each ground’s `glyph.color`; `"display"`, `"accent"`, or hex for overrides |
| **`opacityMin` / `opacityMax`** | `0`–`1` | Hero glyph strength after blend (fallback when a mode has no entry in `blendModes`) |
| **`blendModes`** | `{ "<mode>": { "min", "max" }, ... }` | Mode pool + per-mode opacity ranges. Keys are the allowed modes |
| **`text`** | `lengthMin` / `lengthMax` | Glyph string length only |
| **`layout`** | `sizeRatio`, `offsetXRatioMin` / `offsetXRatioMax` | Width fraction; random horizontal shift (clipping OK) |
| **`accessibility`** | `excludeTitleFaces`, `respectReducedTransparency`, `respectHighContrast` | Face blocklist; OS preference gates |

Symbol source uses **`typePattern.symbol`** (not hero). Blend uses **`heroGlyph.blendModes`** (not pattern).

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `heroGlyph.roll.probability` → `1` | Every eligible poster uses a mega-glyph |
| `heroGlyph.blendModes` → `{ "exclusion": {...}, "overlay": {...} }` | Hero composite pool only |
| `typePattern.blendModes` → `{ "multiply": {...}, "screen": {...} }` | Mini-pattern composite pool only |
| `heroGlyph.roll.probability` → `0` | Only mini patterns / none |

#### `typePattern` — mini canvas patterns

One `renderTypePattern` per poster empty region (`lib/type-pattern-poster.js`, `lib/glyph-region.js`).

| Group | Keys | Role |
|-------|------|------|
| **`roll`** | `noneProbability` (`0.18`) | Skip pattern entirely on this poster |
| **`symbol`** | `pool`, `probability` | Character source (`pool` → `symbolPool`). Digits ignored. |
| **`blendModes`** | `{ "<mode>": { "min", "max" }, ... }` | Pattern composite pool + per-mode opacity. Keys are the allowed modes |
| **`shape`** | `patternTypes`, `fillSpace`, `opticalTight`, `followPath`, `flipReadable`, `flipAlternateVertical`, `flipAlternateHorizontal` | Pattern geometry + letter behavior |
| **`geometry`** | `*Min` / `*Max` ranges | `repeats`, `padding`, `tightTracking`, `lineAngle`, `startAngleDeg`, `arcSweepDeg`, `spiralTurns`, `waveAmplitude`, `waveCycles`, `gridColumns`, `gridStaggerProbability`, `fillAngle`, `fillRowGap`, optional `fontSizeMin` / `fontSizeMax` |
| **`placement`** | `regionPreference`, `emptySpaceMinPx`, `emptySpaceMinRatio`, `regionInsetPx`, `alignToCardEdge`, `fallbackBandWidth`, `sideBandWidthRatio`, `fallbackSide`, `edgeOverflowPx` | Where on the card |
| **`appearance`** | `opacityMin`, `opacityMax` | Pattern strength after blend (`0`–`1`). Omit both to inherit `glyph.opacity`. Blend applies to the **whole pattern layer** once (letters overlap without stacking blend). |

**Blend modes allowed:** `difference`, `exclusion`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`.

Patterns re-measure after poster title fitting so bands track the final title height.

**Legacy flat keys** (e.g. `symbolPool`, `blend.modes` + `blend.opacity`, `patternTypes` at the top level of `typePattern`) still merge; grouped keys win on conflict.

### `theme.code`

Code blocks (`pre`) and inline `` `code` `` on posters and page prose.

| Key | Role |
|-----|------|
| `text` | Text on code blocks — semantic or hex; maps to `--config-code-text` (does **not** follow dark-mode `--paper`) |
| `blockSteps` | OKLCH darken steps from surface/paper (default `2`) |
| `blockStepMix` | Target mix toward black for `referenceSteps` (default `0.36` at 2 steps) |
| `referenceSteps` | Steps `blockStepMix` is calibrated for when `autoCompensateMix` is on (default `2`) |
| `autoCompensateMix` | When `true` (default), scales per-step mix so total darkness stays constant as `blockSteps` changes — e.g. 1 step uses ~`0.59` to match 2×`0.36`. Set `false` to use literal `blockStepMix` per step. |
| `inlineSurfaceMix` | Chip tint: mix of darkened block bg back toward surface (e.g. `"35%"`) — used for both inline and block code |
| `chipDarkBodyLift` | Dark poster body (`ink`): code chips this much **lighter than the ground** — `color-mix` from `surface` toward `paper` (default `"20%"`) |
| `chipLightSurfaceShade` | **White** ground (≈ page paper) and **carmine** (white body): chips this much **darker** — mix from `surface` toward black (default `"10%"`) |
| `chipPaperMix` | Optional extra lift toward `paper` on lighten grounds only |

Per-ground `codeChipPaperMix` overrides `chipPaperMix` when one ground needs more lift.

Injected CSS (`#gallery-config-code`) sets `--on-ground-code-chip-bg` per ground, `--code-chip-bg` on `:root`, and `--on-ground-code-bg` (darken expression for export).

---

## `grounds` — poster palette & glyph overrides

**Surface + foreground colors** live in `assets/css/site/01-tokens.css` (`--color-ground-*` primaries, `--ground-*` semantics) and `assets/css/site/04-grounds.css` (`.ground-*` → `--on-ground-*`). `gallery.config.json` lists which grounds exist and optional glyph overrides.

**Accessibility:** tune **`--color-ground-*`** primaries until APCA passes — do not lighten surfaces just to salvage text. See [`docs/DESIGN.md`](../docs/DESIGN.md#background-first-foreground-adapts).

```json
"mint": {
  "glyph": {
    "color": "ground-mint-glyph",
    "opacity": 0.09
  },
  "heroGlyph": {
    "opacityMin": 0.12,
    "opacityMax": 0.22,
    "blendModes": {
      "exclusion": { "min": 0.2, "max": 0.35 }
    }
  }
}
```

| Field | Role |
|-------|------|
| `glyph.color` | Pattern letter color — `"display"`, `"red"`, `ground-mint-glyph`, or hex; falls back to `theme.graphics.glyph.color` |
| `glyph.opacity` | CSS pattern strength (`0`–`1`); falls back to global glyph opacity |
| `glyph.opacityMin` / `glyph.opacityMax` | Canvas blend opacity fallback for type patterns on this ground |
| `glyph.blendModes` | Restricts type-pattern rolls to these modes on this ground; per-mode `{ min, max }` overrides global opacity for that mode |
| `heroGlyph.color` | Hero glyph color — semantic (`"glyph"`, `"display"`, `"accent"`) or hex; falls back to global `heroGlyph.color` |
| `heroGlyph.opacityMin` / `opacityMax` | Hero glyph canvas opacity fallback on this ground |
| `heroGlyph.blendModes` | Restricts hero-glyph rolls to these modes on this ground; per-mode opacity overrides global |
| `foreground.*` | Optional overrides (token slugs like `ground-pink-display`); defaults from `lib/ground-tokens.js` |
| `surface` | Optional override (token slug like `ground-pink`); defaults to ground key name |

Token slugs resolve via `resolveColor()` — same pattern as `ink`, `red`, `paper`.

---

## `fonts`

| Key | Role |
|-----|------|
| `uiSans` | UI + default sans (`family`, `google`, optional `lineHeight` — defaults to `bodyLineHeight`) |
| `uiSerif` | Serif body toggle (`family`, `google`, optional `lineHeight`) |
| `mono` | Mono labels and code blocks (`family`, `google`, optional `lineHeight`) |
| `titleFaces` | Rotating display fonts per poster (`id`, `google`, optional `lineHeight`, `headingLineHeight`, `letterSpacing`) |

Per-face typography is injected as `#gallery-config-title-faces` (same pattern as grounds/code). Title fitting (`lib/fit-poster-title.js`) reads live line-height from the DOM.

---

## `titleScale`

DOM title fitting (`lib/fit-poster-title.js`):

| Field | Role |
|-------|------|
| `minPx`, `maxPx`, `maxWidthRatio` | Defaults for the shortest tier (and fallback when `tiers` is omitted) |
| `floorPx` | Lowest px the fitter may use when `maxLines` still fails at tier `minPx` (default 14) |
| `slackMinPx`, `bAspect` | When header+body slack is large enough, add `.post-card--roomy` and B-aspect `--poster-min-height` |
| `tiers[]` | Upper bounds on **plain** title length (`data-title-chars` on the card). First matching tier wins (`maxChars: null` = catch-all). Per tier: optional `minPx`, `maxWidthRatio`, `maxLines`, `maxPxRatio`, `floorPx`. |

Binary search picks the largest `--poster-title-size` up to the width-derived cap, within `maxLines` (measured via block height ÷ line-height). Config reload refits open posters (refocus tab). Re-open a file after code changes so `data-title-chars` is present. No CSS height clip on the title box.

---

## What stays in CSS

- Layout that is not yet tokenized (gallery gaps, some clamps, title-face **font-family** rules)
- Dark-mode **component** rules that reference `--chrome-*`
- Prose element styling (lists, tables, code blocks)

To add a new ground: add a key under `grounds` in JSON — no CSS edit required.
