/**
 * Per-ground overrides for type-pattern glyphs and hero glyphs.
 * Ground `glyph` / `heroGlyph` merge onto global `theme.graphics` at render time.
 */

import { normalizeOpacityRange } from './glyph-blend-opacity.js';
import { getGroundDefs, resolveLandingHeaderConfig } from './gallery-config.js';
import { HERO_GLYPH_DEFAULTS } from './poster-hero-glyph.js';
import {
  applyAppearanceOpacityFallback,
  flattenGroupedConfig,
  mergeGraphicBlendConfig,
  normalizeGraphicBlendConfig,
  resolveGlyphPatternTokens,
  resolveTypePatternConfig
} from './resolve-graphics-config.js';
import { resolveHeroGlyphConfig } from './poster-hero-glyph.js';

const GLYPH_OVERRIDE_GROUPS = ['roll', 'symbol', 'blend', 'shape', 'geometry', 'placement', 'appearance'];

/** @type {Record<string, Record<string, string>>} */
const GLYPH_OVERRIDE_ALIASES = {
  symbol: { pool: 'symbolPool', probability: 'symbolProbability' },
  blend: { modes: 'blendModes', mode: 'blendMode', opacity: 'blendOpacity' }
};

/**
 * @param {Record<string, unknown> | undefined} raw
 * @returns {Record<string, unknown>}
 */
export function flattenGroundGraphicOverrides(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  /** @type {Record<string, unknown>} */
  const flat = { ...raw };
  return normalizeGraphicBlendConfig(flat, raw);
}

/**
 * @param {Record<string, unknown>} target
 * @param {{ opacity?: unknown, opacityMin?: unknown, opacityMax?: unknown }} source
 * @param {number} [inheritOpacity]
 * @param {number} [defaultOpacity=1]
 */
function applyGroundOpacityOverrides(target, source, inheritOpacity, defaultOpacity = 1) {
  if (source.opacityMin != null || source.opacityMax != null) {
    const range = normalizeOpacityRange(
      source.opacityMin,
      source.opacityMax,
      {
        opacityMin: inheritOpacity ?? defaultOpacity,
        opacityMax: inheritOpacity ?? defaultOpacity
      }
    );
    target.opacityMin = range.opacityMin;
    target.opacityMax = range.opacityMax;
    return;
  }

  applyAppearanceOpacityFallback(target, source, inheritOpacity, defaultOpacity);
}

/**
 * @param {Record<string, unknown>} merged
 * @param {Record<string, unknown>} overrides
 * @param {Record<string, unknown>} base
 */
function applyGroundBlendOverrides(merged, overrides, base) {
  const blended = mergeGraphicBlendConfig(base, overrides);
  merged.blendModes = blended.blendModes;
  merged.blendOpacity = blended.blendOpacity;
  if (blended.blendMode != null) merged.blendMode = blended.blendMode;
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
  const globalGlyph = resolveGlyphPatternTokens(cfg);
  /** @type {Record<string, unknown>} */
  const merged = { ...patternCfg };

  applyGroundBlendOverrides(merged, g, patternCfg);

  if (g.opacity != null || g.opacityMin != null || g.opacityMax != null) {
    applyGroundOpacityOverrides(
      merged,
      /** @type {{ opacity?: unknown, opacityMin?: unknown, opacityMax?: unknown }} */ (g),
      globalGlyph.opacity
    );
  }

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

  if (h.color != null) merged.color = String(h.color);

  applyGroundBlendOverrides(merged, h, heroCfg);

  if (h.opacity != null || h.opacityMin != null || h.opacityMax != null) {
    applyGroundOpacityOverrides(
      merged,
      /** @type {{ opacity?: unknown, opacityMin?: unknown, opacityMax?: unknown }} */ (h),
      undefined,
      HERO_GLYPH_DEFAULTS.opacity
    );
  }

  return /** @type {ReturnType<typeof resolveHeroGlyphConfig>} */ (merged);
}

/**
 * Landing hero glyph overrides — pattern pool, placement, opacity, etc.
 * @param {ReturnType<typeof resolveTypePatternConfig>} patternCfg
 * @param {Record<string, unknown>} headerGlyph
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 */
export function mergeLandingHeaderGlyphIntoPatternConfig(patternCfg, headerGlyph, cfg) {
  if (!headerGlyph || typeof headerGlyph !== 'object') return patternCfg;
  const flat = flattenGroupedConfig(headerGlyph, GLYPH_OVERRIDE_GROUPS, GLYPH_OVERRIDE_ALIASES);
  normalizeGraphicBlendConfig(flat, headerGlyph);
  /** @type {Record<string, unknown>} */
  const merged = { ...patternCfg, ...flat };

  applyGroundBlendOverrides(merged, flat, patternCfg);

  if (flat.opacity != null || flat.opacityMin != null || flat.opacityMax != null) {
    applyGroundOpacityOverrides(
      merged,
      /** @type {{ opacity?: unknown, opacityMin?: unknown, opacityMax?: unknown }} */ (flat),
      resolveGlyphPatternTokens(cfg).opacity
    );
  }

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
