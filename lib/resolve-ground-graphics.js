/**
 * Per-ground overrides for type-pattern glyphs and hero glyphs.
 * Ground `glyph` / `heroGlyph` merge onto global `theme.graphics` at render time.
 */

import { getGroundDefs, resolveLandingHeaderConfig } from './gallery-config.js';
import {
  flattenGroupedConfig,
  mergeGraphicColorConfig,
  normalizeGraphicColorConfig,
  resolveTypePatternConfig
} from './resolve-graphics-config.js';
import { resolveHeroGlyphConfig } from './poster-hero-glyph.js';

const GLYPH_OVERRIDE_GROUPS = ['roll', 'symbol', 'shape', 'geometry', 'placement', 'appearance'];

/** @type {Record<string, Record<string, string>>} */
const GLYPH_OVERRIDE_ALIASES = {
  symbol: { pool: 'symbolPool', probability: 'symbolProbability' }
};

/**
 * @param {Record<string, unknown> | undefined} raw
 * @returns {Record<string, unknown>}
 */
export function flattenGroundGraphicOverrides(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  /** @type {Record<string, unknown>} */
  const flat = { ...raw };
  return normalizeGraphicColorConfig(flat, raw);
}

/**
 * @param {Record<string, unknown>} merged
 * @param {Record<string, unknown>} overrides
 * @param {Record<string, unknown>} base
 */
function applyGroundColorOverrides(merged, overrides, base) {
  const colored = mergeGraphicColorConfig(base, overrides);
  if (colored.colors) merged.colors = colored.colors;
  if (colored.color != null) merged.color = colored.color;
}

/** @param {HTMLElement | null | undefined} el */
export function groundNameFromElement(el) {
  if (!el?.classList) return null;
  const cls = [...el.classList].find((c) => c.startsWith('ground-'));
  return cls ? cls.slice('ground-'.length) : null;
}

/**
 * @param {import('./gallery-config.js').GroundDef} groundDef
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 * @param {ReturnType<typeof resolveTypePatternConfig>} patternCfg
 */
export function mergeGroundGlyphIntoPatternConfig(patternCfg, groundDef, cfg) {
  if (!groundDef?.glyph) return patternCfg;
  const g = flattenGroundGraphicOverrides(groundDef.glyph);
  /** @type {Record<string, unknown>} */
  const merged = { ...patternCfg };
  applyGroundColorOverrides(merged, g, patternCfg);
  return /** @type {ReturnType<typeof resolveTypePatternConfig>} */ (merged);
}

/**
 * @param {import('./gallery-config.js').GroundDef} groundDef
 * @param {ReturnType<typeof resolveHeroGlyphConfig>} heroCfg
 */
export function mergeGroundHeroGlyphIntoConfig(heroCfg, groundDef) {
  if (!groundDef?.heroGlyph) return heroCfg;
  const h = flattenGroundGraphicOverrides(groundDef.heroGlyph);
  /** @type {Record<string, unknown>} */
  const merged = { ...heroCfg };
  applyGroundColorOverrides(merged, h, heroCfg);
  return /** @type {ReturnType<typeof resolveHeroGlyphConfig>} */ (merged);
}

/**
 * Landing hero glyph overrides — pattern pool, placement, colors, etc.
 * @param {ReturnType<typeof resolveTypePatternConfig>} patternCfg
 * @param {Record<string, unknown>} headerGlyph
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 */
export function mergeLandingHeaderGlyphIntoPatternConfig(patternCfg, headerGlyph, cfg) {
  if (!headerGlyph || typeof headerGlyph !== 'object') return patternCfg;
  const flat = flattenGroupedConfig(headerGlyph, GLYPH_OVERRIDE_GROUPS, GLYPH_OVERRIDE_ALIASES);
  normalizeGraphicColorConfig(flat, headerGlyph);
  /** @type {Record<string, unknown>} */
  const merged = { ...patternCfg, ...flat };
  applyGroundColorOverrides(merged, flat, patternCfg);
  merged.noneProbability = 0;
  return /** @type {ReturnType<typeof resolveTypePatternConfig>} */ (merged);
}

/**
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 * @param {HTMLElement} card
 */
export function resolveCardPatternConfig(cfg, card) {
  let patternCfg = resolveTypePatternConfig(cfg);
  const name = groundNameFromElement(card);
  if (name) {
    const def = getGroundDefs(cfg)[name];
    if (def) patternCfg = mergeGroundGlyphIntoPatternConfig(patternCfg, def, cfg);
  }
  if (card.classList.contains('landing-name-card')) {
    const header = resolveLandingHeaderConfig(cfg);
    if (header.glyph && Object.keys(header.glyph).length) {
      patternCfg = mergeLandingHeaderGlyphIntoPatternConfig(patternCfg, header.glyph, cfg);
    }
  }
  return patternCfg;
}

/**
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 * @param {HTMLElement} card
 */
export function resolveCardHeroGlyphConfig(cfg, card) {
  const heroCfg = resolveHeroGlyphConfig(cfg);
  const name = groundNameFromElement(card);
  if (!name) return heroCfg;
  const def = getGroundDefs(cfg)[name];
  if (!def) return heroCfg;
  return mergeGroundHeroGlyphIntoConfig(heroCfg, def);
}
