/**
 * Opacity for baked canvas glyph blends.
 *
 * Config shape (after flattening grouped JSON):
 * - `blendOpacity.<mode>.min` / `.max` — per blend mode (primary)
 * - `opacityMin` / `opacityMax` — fallback when a mode has no entry (from appearance)
 */

/** Canvas composite modes allowed in `blendModes` / `blendMode`. */
export const POSTER_GLYPH_BLEND_MODES = [
  'difference',
  'exclusion',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'saturation',
  'source-over'
];

/** @param {string} mode */
export function normalizeBlendMode(mode) {
  const m = String(mode);
  if (m === 'normal' || m === 'plain') return 'source-over';
  return m;
}

/** True when the mode needs surface-fill + canvas composite (not plain alpha). */
export function isCanvasBlendMode(mode) {
  const m = normalizeBlendMode(mode);
  return Boolean(m && m !== 'source-over' && POSTER_GLYPH_BLEND_MODES.includes(m));
}

/** @param {number} n */
function clamp01(n) {
  const v = Number.parseFloat(String(n));
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/**
 * @param {number | undefined} min
 * @param {number | undefined} max
 * @param {{ opacityMin: number; opacityMax: number }} [defaults]
 */
export function normalizeOpacityRange(min, max, defaults = { opacityMin: 1, opacityMax: 1 }) {
  const lo = clamp01(min ?? defaults.opacityMin);
  const hi = clamp01(max ?? defaults.opacityMax);
  return { opacityMin: Math.min(lo, hi), opacityMax: Math.max(lo, hi) };
}

/**
 * @param {{ opacityMin?: number; opacityMax?: number; blendOpacity?: Record<string, { min?: number; max?: number; opacityMin?: number; opacityMax?: number }> }} cfg
 * @param {string} blendMode
 * @param {{ opacityMin: number; opacityMax: number }} [defaults]
 */
export function resolveBlendOpacityRange(cfg, blendMode, defaults = { opacityMin: 1, opacityMax: 1 }) {
  const fallback = normalizeOpacityRange(cfg.opacityMin, cfg.opacityMax, defaults);
  const byMode = cfg.blendOpacity;
  if (!byMode || typeof byMode !== 'object' || Array.isArray(byMode)) return fallback;

  const normalized = normalizeBlendMode(String(blendMode ?? ''));
  const lookupKeys = [
    normalized,
    String(blendMode ?? ''),
    normalized === 'source-over' ? 'plain' : '',
    normalized === 'source-over' ? 'normal' : ''
  ].filter(Boolean);

  /** @type {Record<string, unknown> | undefined} */
  let entry;
  for (const key of lookupKeys) {
    if (byMode[key] && typeof byMode[key] === 'object' && !Array.isArray(byMode[key])) {
      entry = byMode[key];
      break;
    }
  }
  if (!entry) return fallback;

  return normalizeOpacityRange(
    entry.min ?? entry.opacityMin,
    entry.max ?? entry.opacityMax,
    fallback
  );
}

/**
 * @param {number} opacityMin
 * @param {number} opacityMax
 * @param {() => number} rand
 */
export function pickOpacityInRange(opacityMin, opacityMax, rand) {
  const { opacityMin: lo, opacityMax: hi } = normalizeOpacityRange(opacityMin, opacityMax);
  if (lo === hi) return lo;
  return lo + rand() * (hi - lo);
}

/**
 * @param {{ opacityMin?: number; opacityMax?: number; blendOpacity?: Record<string, unknown> }} cfg
 * @param {string} blendMode
 * @param {() => number} rand
 * @param {{ opacityMin: number; opacityMax: number }} [defaults]
 */
export function pickGlyphBlendOpacity(cfg, blendMode, rand, defaults) {
  const { opacityMin, opacityMax } = resolveBlendOpacityRange(cfg, blendMode, defaults);
  return pickOpacityInRange(opacityMin, opacityMax, rand);
}
