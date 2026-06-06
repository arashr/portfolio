# Gallery design system (`gallery.config.json`)

Single source of truth for theme, poster grounds, typography, spacing, and title fitting. Loaded at startup by `lib/gallery-config.js` and applied as CSS custom properties + a small injected stylesheet for per-ground tokens.

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
| `grounds.*.surface` | Poster card background color |

If nothing changes: hard-refresh the page (Cmd+Shift+R), re-drop your `.md` file, and confirm the JSON is valid (a parse error keeps the previous config).

**Ground rules, APCA targets, OKLCH usage:** [`docs/DESIGN.md`](../docs/DESIGN.md).

**Reload:** save the file, then refocus the browser tab (or refresh). Changes apply without rebuilding.

---

## `theme` — page chrome & shared tokens

### `theme.colors`

| Key | Role |
|-----|------|
| `paper` | Page background |
| `ink` | Primary text |
| `inkSoft` | Body / secondary text |
| `inkMute` | Meta, hints (rgba ok) |
| `red` | Accent |
| `redBright` | Accent hover / focus |

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

### `theme.typography`

| Key | Maps to |
|-----|---------|
| `bodySize` | `body` font-size |
| `bodyLineHeight` | `body` line-height |
| `proseLineHeight` | `.prose` line-height (sans body) |
| `titleLineHeight` | Default poster title line-height |
| `titleHeadingLineHeight` | In-post h2–h4 on title-face cards (when face has no override) |
| `titleFaceLetterSpacing` | Default letter-spacing for title faces |
| `labelSize` | `.kicker`, `.mono-label` |
| `labelWeight` | label weight |
| `labelLetterSpacing` | label tracking |
| `proseSize` | `.prose` inside posters |
| `crumbSize` | breadcrumbs |

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
| `color` | `"display"` | Pattern letter color — semantic or hex → `--config-glyph-pattern-color` / per-ground `--on-ground-glyph-pattern-color` |
| `opacity` | `0.07` | Default pattern strength; used when `typePattern.appearance` omits `opacityMin`/`opacityMax`. Also `--glyph-pattern-opacity` for legacy CSS-only faintness. |

Legacy flat keys `glyphPatternColor` / `glyphPatternOpacity` still merge.

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
| **`text`** | `lengthMin` / `lengthMax`, `glyphColor` | Glyph string + fill before blend |
| **`layout`** | `sizeRatio`, `offsetXRatioMin` / `offsetXRatioMax` | Width fraction; random horizontal shift (clipping OK) |
| **`appearance`** | `opacity` | Glyph strength after blend (`0`–`1`) |
| **`blend`** | `modes`, `mode` | Hero-only composite pool (`modes` → `blendModes`); independent of `typePattern.blend` |
| **`accessibility`** | `excludeTitleFaces`, `respectReducedTransparency`, `respectHighContrast` | Face blocklist; OS preference gates |

Symbol source uses **`typePattern.symbol`** (not hero). Blend uses **`heroGlyph.blend`** (not pattern).

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `heroGlyph.roll.probability` → `1` | Every eligible poster uses a mega-glyph |
| `heroGlyph.blend.modes` → `["exclusion", "overlay"]` | Hero composite pool only |
| `typePattern.blend.modes` → `["multiply", "screen"]` | Mini-pattern composite pool only |
| `heroGlyph.roll.probability` → `0` | Only mini patterns / none |

#### `typePattern` — mini canvas patterns

One `renderTypePattern` per poster empty region (`lib/type-pattern-poster.js`, `lib/glyph-region.js`).

| Group | Keys | Role |
|-------|------|------|
| **`roll`** | `noneProbability` (`0.18`) | Skip pattern entirely on this poster |
| **`symbol`** | `pool`, `probability` | Character source (`pool` → `symbolPool`). Digits ignored. |
| **`blend`** | `modes`, `mode` | Pattern-only composite pool (`modes` → `blendModes`); independent of `heroGlyph.blend` |
| **`shape`** | `patternTypes`, `fillSpace`, `opticalTight`, `followPath`, `flipReadable`, `flipAlternateVertical`, `flipAlternateHorizontal` | Pattern geometry + letter behavior |
| **`geometry`** | `*Min` / `*Max` ranges | `repeats`, `padding`, `tightTracking`, `lineAngle`, `startAngleDeg`, `arcSweepDeg`, `spiralTurns`, `waveAmplitude`, `waveCycles`, `gridColumns`, `gridStaggerProbability`, `fillAngle`, `fillRowGap`, optional `fontSizeMin` / `fontSizeMax` |
| **`placement`** | `regionPreference`, `emptySpaceMinPx`, `emptySpaceMinRatio`, `regionInsetPx`, `alignToCardEdge`, `fallbackBandWidth`, `sideBandWidthRatio`, `fallbackSide`, `edgeOverflowPx` | Where on the card |
| **`appearance`** | `opacityMin`, `opacityMax` | Pattern strength after blend (`0`–`1`). Omit both to inherit `glyph.opacity`. Blend applies to the **whole pattern layer** once (letters overlap without stacking blend). |

**Blend modes allowed:** `difference`, `exclusion`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`.

Patterns re-measure after poster title fitting so bands track the final title height.

**Legacy flat keys** (e.g. `symbolPool`, `blendModes`, `patternTypes` at the top level of `typePattern`) still merge; grouped keys win on conflict.

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

## `darkTheme` — UI chrome only

Posters keep their configured ground colors in dark mode; only the shell (header, drop zone, TOC) uses these.

| Path | Role |
|------|------|
| `paper` | Dark page background |
| `colors.ink` / `inkSoft` / `inkMute` | Chrome text |
| `colors.red` / `redBright` | Chrome accents |
| `dropZone.butterMix` | Butter tint on drop-zone hover (e.g. `"22%"`) |

---

## `grounds` — poster surfaces & text pairs

Each ground is an object (or a **string** hex for surface only — then default foreground presets apply).

**Accessibility:** choose **`surface` first** (the brand color). Tune **`foreground.*`** until APCA passes — do not lighten the surface just to salvage a default text color. See [`docs/DESIGN.md`](../docs/DESIGN.md#background-first-foreground-adapts).

```json
"mint": {
  "surface": "#a7dbce",
  "foreground": {
    "display": "red",
    "body": "inkSoft",
    "muted": "#363b40",
    "accent": "red",
    "focus": "redBright"
  }
}
```

| Field | Role |
|-------|------|
| `surface` | Poster background (`--ground-*`) |
| `foreground.display` | Titles, headings on ground |
| `foreground.body` | Body / prose |
| `foreground.muted` | Meta, captions |
| `foreground.accent` | Tags, accents |
| `foreground.focus` | Focus ring on ground |
| `foreground.linkHoverText` | Prose link hover text (default `#ffffff`) |
| `foreground.linkHoverBg` | Prose link hover background (default `ink`) |

`foreground.*` values can be semantic (`"red"`, `"inkSoft"`) or any CSS color (`"#363b40"`).

**Default presets** (when you only pass a hex string): light grounds → red display; `tangerine` / `forest` / `carmine` use their own pairs (see defaults in `lib/gallery-config.js`).

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
