/**
 * Normalizes grouped `theme.graphics` config into flat objects used by the reader.
 * Grouped keys in JSON; legacy flat keys still merge on read.
 */

import { TYPE_PATTERN_DEFAULTS } from './type-pattern-poster.js';

const TYPE_PATTERN_GROUPS = ['roll', 'symbol', 'blend', 'shape', 'geometry', 'placement', 'appearance'];

/** @type {Record<string, Record<string, string>>} */
const TYPE_PATTERN_ALIASES = {
  symbol: { pool: 'symbolPool', probability: 'symbolProbability' },
  blend: { modes: 'blendModes', mode: 'blendMode', opacity: 'blendOpacity' }
};

const HERO_GLYPH_GROUPS = ['roll', 'text', 'layout', 'appearance', 'blend', 'accessibility'];

/** @type {Record<string, Record<string, string>>} */
const HERO_GLYPH_ALIASES = {
  blend: { modes: 'blendModes', mode: 'blendMode', opacity: 'blendOpacity' }
};

/**
 * Ensures flat config has `opacityMin` / `opacityMax` fallback for blend modes
 * without a per-mode entry in `blend.opacity`.
 *
 * @param {Record<string, unknown>} flat
 * @param {Record<string, unknown> | undefined} appearance
 * @param {number | undefined} inheritOpacity — e.g. shared `glyph.opacity`
 * @param {number} [defaultOpacity=1]
 */
export function applyAppearanceOpacityFallback(flat, appearance, inheritOpacity, defaultOpacity = 1) {
  const hasRange =
    appearance &&
    typeof appearance === 'object' &&
    !Array.isArray(appearance) &&
    ('opacityMin' in appearance || 'opacityMax' in appearance);
  if (hasRange) return flat;

  const singleRaw = appearance?.opacity ?? flat.opacity;
  const single = Number.parseFloat(String(singleRaw));
  if (Number.isFinite(single)) {
    const o = Math.min(1, Math.max(0, single));
    flat.opacityMin = o;
    flat.opacityMax = o;
    return flat;
  }

  const inherited = inheritOpacity ?? defaultOpacity;
  flat.opacityMin = inherited;
  flat.opacityMax = inherited;
  return flat;
}

/**
 * @param {Record<string, unknown> | undefined} raw
 * @param {string[]} groups
 * @param {Record<string, Record<string, string>>} [aliasesByGroup]
 */
export function flattenGroupedConfig(raw, groups, aliasesByGroup = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  /** @type {Record<string, unknown>} */
  const out = {};

  for (const [key, value] of Object.entries(raw)) {
    if (groups.includes(key) && value && typeof value === 'object' && !Array.isArray(value)) continue;
    out[key] = value;
  }

  for (const group of groups) {
    const section = raw[group];
    if (!section || typeof section !== 'object' || Array.isArray(section)) continue;
    const aliases = aliasesByGroup[group] || {};
    for (const [key, value] of Object.entries(section)) {
      out[aliases[key] ?? key] = value;
    }
  }

  return out;
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveTypePatternConfig(cfg) {
  const raw = cfg?.theme?.graphics?.typePattern;
  const flat = flattenGroupedConfig(raw, TYPE_PATTERN_GROUPS, TYPE_PATTERN_ALIASES);
  applyAppearanceOpacityFallback(flat, raw?.appearance, resolveGlyphPatternTokens(cfg).opacity);
  return {
    ...TYPE_PATTERN_DEFAULTS,
    ...flat
  };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveGlyphPatternTokens(cfg) {
  const graphics = cfg?.theme?.graphics || {};
  const nested = typeof graphics.glyph === 'object' && graphics.glyph ? graphics.glyph : {};
  const opacityRaw = nested.opacity ?? graphics.glyphPatternOpacity;
  const opacityNum = Number.parseFloat(String(opacityRaw));
  return {
    color: String(nested.color ?? graphics.glyphPatternColor ?? 'display'),
    opacity: Number.isFinite(opacityNum) ? Math.min(1, Math.max(0, opacityNum)) : 0.07
  };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function flattenHeroGlyphConfig(cfg) {
  return flattenGroupedConfig(cfg?.theme?.graphics?.heroGlyph, HERO_GLYPH_GROUPS, HERO_GLYPH_ALIASES);
}
