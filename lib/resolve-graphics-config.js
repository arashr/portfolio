/**
 * Normalizes grouped `theme.graphics` config into flat objects used by the reader.
 * Grouped keys in JSON; legacy flat keys still merge on read.
 */

import { TYPE_PATTERN_DEFAULTS } from './type-pattern-poster.js';
import { normalizeColorPool, resolveColorPool } from './glyph-colors.js';

const TYPE_PATTERN_GROUPS = ['roll', 'symbol', 'shape', 'geometry', 'placement', 'appearance'];

/** @type {Record<string, Record<string, string>>} */
const TYPE_PATTERN_ALIASES = {
  symbol: { pool: 'symbolPool', probability: 'symbolProbability' }
};

const HERO_GLYPH_GROUPS = ['roll', 'text', 'layout', 'appearance', 'accessibility'];

/**
 * Unify graphic color config: prefer `colors[]`, fall back to singular `color`.
 * Strips legacy blend / opacity fields.
 *
 * @param {Record<string, unknown>} flat
 * @param {Record<string, unknown> | undefined} [raw]
 */
export function normalizeGraphicColorConfig(flat, raw = flat) {
  const fromColors = normalizeColorPool(flat.colors ?? raw?.colors);
  const color =
    flat.color ??
    flat.glyphColor ??
    (raw?.text && typeof raw.text === 'object' && !Array.isArray(raw.text)
      ? raw.text.color ?? raw.text.glyphColor
      : undefined);

  if (fromColors.length) {
    flat.colors = fromColors;
    flat.color = fromColors[0];
  } else if (color != null) {
    const single = String(color);
    flat.color = single;
    flat.colors = [single];
  }

  delete flat.glyphColor;
  delete flat.blendModes;
  delete flat.blendOpacity;
  delete flat.blendMode;
  delete flat._blendModesFromMap;
  delete flat.opacityMin;
  delete flat.opacityMax;
  delete flat.opacity;

  return flat;
}

/**
 * Merge color overrides onto a base config.
 * Ground / landing `colors` (or singular `color`) replace the base pool when present.
 *
 * @param {Record<string, unknown>} base
 * @param {Record<string, unknown>} overrides
 */
export function mergeGraphicColorConfig(base, overrides) {
  /** @type {Record<string, unknown>} */
  const out = { ...base };
  const overridePool = resolveColorPool(
    /** @type {{ colors?: unknown, color?: unknown }} */ (overrides)
  );
  if (overridePool.length) {
    out.colors = overridePool;
    out.color = overridePool[0];
  }
  return out;
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
  normalizeGraphicColorConfig(flat, raw);
  return {
    ...TYPE_PATTERN_DEFAULTS,
    ...flat
  };
}

const GLYPH_PATTERN_CSS_DEFAULTS = { color: '#c8102e', opacity: 1 };

function readRootToken(cssVar, fallback) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveGlyphPatternTokens(cfg) {
  const graphics = cfg?.theme?.graphics || {};
  const nested = typeof graphics.glyph === 'object' && graphics.glyph ? graphics.glyph : {};
  const typePattern = typeof graphics.typePattern === 'object' && graphics.typePattern ? graphics.typePattern : {};
  const pool = resolveColorPool({
    colors: nested.colors ?? typePattern.colors ?? graphics.glyphPatternColors,
    color: nested.color ?? typePattern.color ?? graphics.glyphPatternColor
  });
  const colorFromCss = readRootToken('--glyph-pattern-color', GLYPH_PATTERN_CSS_DEFAULTS.color);

  return {
    color: pool[0] || colorFromCss,
    colors: pool.length ? pool : [colorFromCss],
    opacity: 1
  };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function flattenHeroGlyphConfig(cfg) {
  const raw = cfg?.theme?.graphics?.heroGlyph;
  const flat = flattenGroupedConfig(raw, HERO_GLYPH_GROUPS);
  normalizeGraphicColorConfig(flat, raw);
  return flat;
}

/** @deprecated Use normalizeGraphicColorConfig */
export const normalizeGraphicBlendConfig = normalizeGraphicColorConfig;
/** @deprecated Use mergeGraphicColorConfig */
export const mergeGraphicBlendConfig = mergeGraphicColorConfig;
