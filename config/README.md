# Gallery design system (`gallery.config.json`)

Single source of truth for poster grounds, layout, motion, graphics, fonts, and title fitting. **Theme colors and typography** live in `assets/css/site/01-tokens.css` (light + dark primaries). Loaded at startup by `lib/gallery-config.js` and applied as CSS custom properties + a small injected stylesheet for per-ground tokens.

**Audience presets** (homepage order / soft-hide per role) live in a sibling file: [`audiences.json`](./audiences.json). See `content/CONTENT.md` → Audience presets. Loaded by `lib/portfolio-audiences.js` via `?for=`.

## Applying edits

1. Run the app with **`npm start`** and open **http://localhost:3000** (not `file://` — the config is loaded via `fetch`).
2. **Save** `config/gallery.config.json`.
3. **Switch away from the browser tab and back** (or change to another app and return). The tab refocus reloads config and redraws poster patterns.
4. Have a **`.md` file open in the reader** — landing page alone does not show posters or glyph patterns.

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `theme.graphics.typePattern.colors` → `["#ff0000"]` | Pattern letters use that solid ink |
| `theme.graphics.typePattern.roll.noneProbability` → `0` | Every poster gets a pattern (none were skipped before) |
| `theme.graphics.typePattern.shape.patternTypes` → `["line"]` only | Only straight-line letter paths |
| `theme.graphics.typePattern.geometry.repeatsMin` / `Max` → `4` / `4` | Fewer, larger gaps between letters |
| `assets/css/site/01-tokens.css` `--color-ground-*` | Poster surface + foreground palette (edit primaries here) |
| `grounds.*.glyph.colors` / `heroGlyph.colors` | Per-ground solid ink pools (random pick per poster) |

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

### `theme.gridOverlay`

Debug Swiss grid on reader/landing posters. Disabled by default; excluded from print.

| Key | Role |
|-----|------|
| `enabled` | Master toggle (`false` by default) |
| `columns` | Show 12-column track bands |
| `rows` | Show horizontal module lines every `2 × --layout-gap` |
| `bounds` | Outline title (red), copy (green), and future media (indigo) |

When enabled, sets `html[data-portfolio-grid-overlay]` to `columns`, `rows`, or `both`.

### `theme.rowSnap`

Snaps title/body packs onto the modular row field (text-only posters, 900px+ grid). Applies to reader `#posters` and landing `#landing-posters` + `#landing-name`. Off by default.

| Key | Role |
|-----|------|
| `enabled` | Run after title fit (`false` by default) |
| `packAlign` | `start`, `center`, or `vary` (six-rhythm beat table) |

Use with `gridOverlay` to verify: title top and body top should land on row band edges.

### `theme.titlePlay`

Column- and length-aware title sizing for reader posters (runs after base fit + row snap).

| Key | Role |
|-----|------|
| `enabled` | Boost short titles in wide column spans (`true` by default) |
| `fillSafeZone` | On `.post-card--roomy`, grow into leftover card height |
| `maxScale` | Cap vs column-scaled size (`1`–`2`, default `1.35`) |
| `shortTitleChars` | Titles at or below this length get `shortTitleBoost` |
| `shortTitleBoost` | Extra multiplier for short titles (`1`–`1.6`) |

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

### `theme.graphics` — poster decoration

Poster graphics are grouped by feature. **`lib/resolve-graphics-config.js`** flattens groups at runtime; legacy flat keys still work.

```
theme.graphics
├── heroGlyph          … mega background glyph (one per poster roll)
│   ├── roll
│   ├── colors[]       … solid fill pool (slug-seeded pick)
│   ├── text
│   ├── layout
│   └── accessibility
└── typePattern        … mini canvas patterns
    ├── roll
    ├── symbol
    ├── colors[]       … solid fill pool (slug-seeded pick)
    ├── shape
    ├── geometry
    └── placement
```

#### `heroGlyph` — mega background glyph

Random alternative to mini `typePattern` on a poster. Defaults in `lib/poster-hero-glyph.js`. Uses **`typePattern.symbol`** for characters.

| Group | Keys | Role |
|-------|------|------|
| **`roll`** | `probability` (`0.22`) | Chance per poster (`0`–`1`) |
| **`colors`** | hex array | Solid fill pool; one color picked per poster (slug-seeded). Ground `heroGlyph.colors` replaces this pool |
| **`text`** | `lengthMin` / `lengthMax` | Glyph string length only |
| **`layout`** | `sizeRatio`, `minVisibleRatio`, `offsetXRatioMin` / `offsetXRatioMax` | Width fraction; minimum visible ink area (`0`–`1`); random horizontal shift |
| **`accessibility`** | `excludeTitleFaces`, `respectReducedTransparency`, `respectHighContrast` | Face blocklist; OS preference gates |

Symbol source uses **`typePattern.symbol`** (not hero).

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `heroGlyph.roll.probability` → `1` | Every eligible poster uses a mega-glyph |
| `heroGlyph.colors` → `["#ff00aa", "#00ffaa"]` | Heroes alternate between those solids |
| `heroGlyph.roll.probability` → `0` | Only mini patterns / none |

#### `typePattern` — mini canvas patterns

One `renderTypePattern` per poster empty region (`lib/type-pattern-poster.js`, `lib/glyph-region.js`).

| Group | Keys | Role |
|-------|------|------|
| **`roll`** | `noneProbability` (`0.18`) | Skip pattern entirely on this poster |
| **`symbol`** | `pool`, `probability` | Character source (`pool` → `symbolPool`). Digits ignored. |
| **`colors`** | hex array | Solid ink pool for pattern letters; ground `glyph.colors` replaces this pool |
| **`shape`** | `patternTypes`, `fillSpace`, `opticalTight`, `followPath`, `flipReadable`, `flipAlternateVertical`, `flipAlternateHorizontal` | Pattern geometry + letter behavior |
| **`geometry`** | `*Min` / `*Max` ranges | `repeats`, `padding`, `tightTracking`, `lineAngle`, `startAngleDeg`, `arcSweepDeg`, `spiralTurns`, `waveAmplitude`, `waveCycles`, `gridColumns`, `gridStaggerProbability`, `fillAngle`, `fillRowGap`, optional `fontSizeMin` / `fontSizeMax` |
| **`placement`** | `regionPreference`, `preferEmptySpace`, `emptySpaceMinPx`, `emptySpaceMinRatio`, `regionInsetPx`, `alignToCardEdge`, `fallbackBandWidth`, `sideBandWidthRatio`, `fallbackSide`, `edgeOverflowPx` | Where on the card |
| | `preferEmptySpace` | When `true`, measures title/copy boxes and picks the largest empty band. **Patterns** use any band; **hero glyphs** prefer side/between gaps (not bottom padding on tall cards) and shift toward that band’s center. |

Patterns draw at full opacity with solid fills (no canvas blend modes). Re-measure after poster title fitting so bands track the final title height.

**Legacy flat keys** (e.g. `symbolPool`, `patternTypes` at the top level of `typePattern`) still merge; grouped keys win on conflict.

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

To temporarily remove a ground from random/slug selection without deleting its tokens, set `"enabled": false` on that ground entry. It stays in config for later re-enabling and is skipped by `getGroundKeys()` / `groundForSlug()`.

**Accessibility:** tune **`--color-ground-*`** primaries until APCA passes — do not lighten surfaces just to salvage text. See [`docs/DESIGN.md`](../docs/DESIGN.md#background-first-foreground-adapts).

```json
"mint": {
  "glyph": {
    "colors": ["#8dd0dd", "#a7dbf0", "#7da4ce"]
  },
  "heroGlyph": {
    "colors": ["#8dd0dd", "#a7dbf0"]
  }
}
```

| Field | Role |
|-------|------|
| `glyph.colors` | Solid ink pool for type patterns on this ground (slug-seeded pick). Replaces global `typePattern.colors` |
| `heroGlyph.colors` | Solid ink pool for mega-glyphs on this ground. Replaces global `heroGlyph.colors` |
| `foreground.*` | Optional overrides (token slugs like `ground-pink-display`); defaults from `lib/ground-tokens.js` |
| `surface` | Optional override (token slug like `ground-pink`); defaults to ground key name |

Token slugs resolve via `resolveColor()` — same pattern as `ink`, `red`, `paper`. First color in each pool is also written to CSS `--on-ground-glyph-pattern-color` (layer opacity is always `1`).

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
| `minPx`, `maxPx`, `maxWidthRatio` | Defaults when `tiers` is omitted (or for the shortest tier) |
| `maxLines`, `maxPxRatio` | Also apply at the top level when `tiers` is omitted |
| `floorPx` | Lowest px the fitter may use when `maxLines` still fails at tier `minPx` (default 14) |
| `slackMinPx`, `bAspect` | When header+body slack is large enough, add `.post-card--roomy` and B-aspect `--poster-min-height` |
| `tiers[]` | Upper bounds on **plain** title length (`data-title-chars` on the card). First matching tier wins (`maxChars: null` = catch-all). Per tier: optional `minPx`, `maxWidthRatio`, `maxLines`, `maxPxRatio`, `floorPx`. |

Binary search picks the largest `--poster-title-size` up to the width-derived cap, within `maxLines` (measured via block height ÷ line-height). Config reload refits open posters (refocus tab). Re-open a file after code changes so `data-title-chars` is present. No CSS height clip on the title box.

### `landing.header`

Homepage name band (`#landing-name`) — independent from reader posters.

| Field | Role |
|-------|------|
| `ground` | Ground token (`indigo`, `carmine`, …) — uses existing `grounds.*` palette |
| `titleFace` | `fonts.titleFaces[].id` for the hero name |
| `titleScale` | Flat fit scale (`minPx`, `maxPx`, `maxWidthRatio`, `maxLines`, `maxPxRatio`) — no length tiers |
| `layout.titleColumnSpan` | Grid span (1–12) for the title column on desktop |
| `layout.copyColumnSpan` | Grid span for tagline / copy row |
| `layout.minHeight` | Band height (e.g. `66vh`) |
| `glyph` | Pattern overrides — same groups as `theme.graphics.typePattern` (`colors`, `symbol`, `shape`, `geometry`, `placement`). Merged on top of the chosen ground |

#### `landing.header.glyph` — fill pattern knobs

When `patternTypes` includes `"fill"` (or is locked to `["fill"]`), these keys matter most:

| Group | Keys | Role |
|-------|------|------|
| **colors** | `colors[]` | Solid ink pool for the header pattern |
| **symbol** | `symbolPool`, `symbolProbability` | Characters drawn; `1` = always pool, never title letter |
| **shape** | `fillSpace`, `opticalTight`, `followPath`, `flipReadable`, `flipAlternateVertical`, `flipAlternateHorizontal` | Dense pack vs path fill; letter flips |
| **geometry** | `repeatsMin/Max`, `fontSizeMin/Max`, `paddingMin/Max`, `tightTrackingMin/Max`, `gridColumnsMin/Max`, `gridStaggerProbability`, `fillAngleMin/Max`, `fillRowGapMin/Max` | Count, size, columns, brick stagger, tilt, row spacing |
| **placement** | `regionPreference`, `preferEmptySpace`, `alignToCardEdge`, … | Where the band sits (e.g. top) |

Injected as CSS vars (`--landing-header-*`) and `--glyph-pattern-color` on the name card. Set `data-lab-glyph="pattern"` so the band always draws a type pattern (not hero/none).

**Recovery:** If header glyph settings get lost, copy `landing.header` from `config/landing-header.preset.json`.

---

## What stays in CSS

- Layout that is not yet tokenized (gallery gaps, some clamps, title-face **font-family** rules)
- Dark-mode **component** rules that reference `--chrome-*`
- Prose element styling (lists, tables, code blocks)

To add a new ground: add a key under `grounds` in JSON — no CSS edit required.
