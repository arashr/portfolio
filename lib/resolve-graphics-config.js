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
 * without a per-mode entry in `blendOpacity`.
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

/**
 * Unify graphic config: `color` (not `glyphColor`), and object-form `blendModes`.
 * Object keys become per-mode opacity overrides (`blendOpacity`);
 * the mode pool is resolved when merging onto a base config.
 *
 * @param {Record<string, unknown>} flat
 * @param {Record<string, unknown> | undefined} [raw]
 */
export function normalizeGraphicBlendConfig(flat, raw = flat) {
  const color =
    flat.color ??
    flat.glyphColor ??
    (raw?.text && typeof raw.text === 'object' && !Array.isArray(raw.text)
      ? raw.text.color ?? raw.text.glyphColor
      : undefined);
  if (color != null) flat.color = String(color);
  delete flat.glyphColor;

  const mapSource =
    raw?.blendModes && typeof raw.blendModes === 'object' && !Array.isArray(raw.blendModes)
      ? raw.blendModes
      : flat.blendModes && typeof flat.blendModes === 'object' && !Array.isArray(flat.blendModes)
        ? flat.blendModes
        : null;

  if (mapSource) {
    const modes = [];
    /** @type {Record<string, unknown>} */
    const opacity = {};
    for (const [mode, range] of Object.entries(mapSource)) {
      modes.push(mode);
      if (range && typeof range === 'object' && !Array.isArray(range)) {
        opacity[mode] = range;
      }
    }
    flat.blendModes = modes;
    flat.blendOpacity = opacity;
    flat._blendModesFromMap = true;
  }

  return flat;
}

/**
 * Merge partial blend overrides onto a base config.
 *
 * - Ground omits `blendModes` → keep the base (global) pool and opacity tables.
 * - Ground defines `blendModes` → pool is restricted to those keys; per-mode opacity
 *   uses the ground entry when present, otherwise falls back to the base table.
 *
 * @param {Record<string, unknown>} base
 * @param {Record<string, unknown>} overrides
 */
export function mergeGraphicBlendConfig(base, overrides) {
  const baseModes = Array.isArray(base.blendModes) ? [...base.blendModes] : [];
  const baseOpacity =
    base.blendOpacity && typeof base.blendOpacity === 'object' && !Array.isArray(base.blendOpacity)
      ? { ...base.blendOpacity }
      : /** @type {Record<string, unknown>} */ ({});

  const overrideOpacity =
    overrides.blendOpacity && typeof overrides.blendOpacity === 'object' && !Array.isArray(overrides.blendOpacity)
      ? /** @type {Record<string, unknown>} */ (overrides.blendOpacity)
      : null;

  /** @type {Record<string, unknown>} */
  const out = { ...base };

  if (overrides._blendModesFromMap && Array.isArray(overrides.blendModes)) {
    out.blendModes = [...overrides.blendModes];
    out.blendOpacity = { ...baseOpacity, ...overrideOpacity };
  } else if (Array.isArray(overrides.blendModes) && overrides.blendModes.length) {
    out.blendModes = [...overrides.blendModes];
    out.blendOpacity = overrideOpacity ? { ...baseOpacity, ...overrideOpacity } : baseOpacity;
  } else {
    out.blendModes = baseModes;
    out.blendOpacity = baseOpacity;
  }

  if (overrides.blendMode != null && !overrides._blendModesFromMap) {
    out.blendMode = overrides.blendMode;
  }

  return out;
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveTypePatternConfig(cfg) {
  const raw = cfg?.theme?.graphics?.typePattern;
  const flat = flattenGroupedConfig(raw, TYPE_PATTERN_GROUPS, TYPE_PATTERN_ALIASES);
  normalizeGraphicBlendConfig(flat, raw);
  applyAppearanceOpacityFallback(flat, raw?.appearance, resolveGlyphPatternTokens(cfg).opacity);
  return {
    ...TYPE_PATTERN_DEFAULTS,
    ...flat
  };
}

const GLYPH_PATTERN_CSS_DEFAULTS = { color: '#c8102e', opacity: 0.07 };

function readRootToken(cssVar, fallback) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveGlyphPatternTokens(cfg) {
  const graphics = cfg?.theme?.graphics || {};
  const nested = typeof graphics.glyph === 'object' && graphics.glyph ? graphics.glyph : {};
  const colorOverride = nested.color ?? graphics.glyphPatternColor;
  const opacityOverride = nested.opacity ?? graphics.glyphPatternOpacity;

  const colorFromCss = readRootToken(
    '--glyph-pattern-color',
    GLYPH_PATTERN_CSS_DEFAULTS.color
  );
  const opacityFromCss = Number.parseFloat(
    readRootToken('--glyph-pattern-opacity', String(GLYPH_PATTERN_CSS_DEFAULTS.opacity))
  );

  const opacityNum = Number.parseFloat(String(opacityOverride));
  return {
    color: colorOverride != null ? String(colorOverride) : colorFromCss,
    opacity: Number.isFinite(opacityNum)
      ? Math.min(1, Math.max(0, opacityNum))
      : Number.isFinite(opacityFromCss)
        ? Math.min(1, Math.max(0, opacityFromCss))
        : GLYPH_PATTERN_CSS_DEFAULTS.opacity
  };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function flattenHeroGlyphConfig(cfg) {
  const raw = cfg?.theme?.graphics?.heroGlyph;
  const flat = flattenGroupedConfig(raw, HERO_GLYPH_GROUPS, HERO_GLYPH_ALIASES);
  normalizeGraphicBlendConfig(flat, raw);
  return flat;
}
