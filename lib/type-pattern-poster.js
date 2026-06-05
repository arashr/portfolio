/**
 * Flat `theme.graphics.typePattern` → `renderTypePattern` options.
 * Random fields use `*Min` / `*Max` (or `patternTypes` + `gridStaggerProbability`).
 */

import { PATTERN_TYPES } from './type-pattern.js';
import {
  isCanvasBlendMode,
  normalizeBlendMode,
  pickGlyphBlendOpacity,
  POSTER_GLYPH_BLEND_MODES
} from './glyph-blend-opacity.js';

export { isCanvasBlendMode, normalizeBlendMode, POSTER_GLYPH_BLEND_MODES };

export const TYPE_PATTERN_DEFAULTS = {
  patternTypes: ['wave', 'grid', 'line'],
  fillSpace: false,
  opticalTight: true,
  followPath: true,
  flipReadable: true,
  flipAlternateVertical: true,
  flipAlternateHorizontal: true,
  repeatsMin: 18,
  repeatsMax: 38,
  paddingMin: 0,
  paddingMax: 0,
  tightTrackingMin: 0.92,
  tightTrackingMax: 0.98,
  lineAngleMin: -25,
  lineAngleMax: 25,
  startAngleDegMin: -180,
  startAngleDegMax: 180,
  arcSweepDegMin: 63,
  arcSweepDegMax: 360,
  spiralTurnsMin: 1,
  spiralTurnsMax: 4.5,
  waveAmplitudeMin: 0.16,
  waveAmplitudeMax: 0.34,
  waveCyclesMin: 2,
  waveCyclesMax: 6,
  gridColumnsMin: 3,
  gridColumnsMax: 7,
  gridStaggerProbability: 0.6,
  fillAngleMin: -18,
  fillAngleMax: 18,
  fillRowGapMin: 1.1,
  fillRowGapMax: 1.2,
  opacityMin: 1,
  opacityMax: 1,
  emptySpaceMinPx: 56,
  emptySpaceMinRatio: 0.1,
  regionInsetPx: 12,
  alignToCardEdge: false,
  regionPreference: ['bottom', 'between', 'top'],
  fallbackBandWidth: 88,
  fallbackSide: 'auto',
  sideBandWidthRatio: 1,
  edgeOverflowPx: 24,
  symbolPool: '+*-´`=/|',
  symbolProbability: 0.55,
  noneProbability: 0.18,
  blendMode: 'difference',
  blendModes: ['difference', 'exclusion', 'multiply', 'screen', 'overlay']
};

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function clampInt(n, fallback) {
  const v = Number.parseInt(String(n), 10);
  return Number.isFinite(v) ? v : fallback;
}

function clampNum(n, fallback) {
  const v = Number.parseFloat(String(n));
  return Number.isFinite(v) ? v : fallback;
}

/** Strip digits from the symbol pool — patterns and hero glyphs use letters and symbols only. */
export function filterPosterSymbolPool(pool) {
  return [...String(pool)]
    .filter((ch) => ch.trim().length > 0 && !/[0-9]/.test(ch))
    .join('');
}

/** @param {string} title */
export function posterTitleLetter(title) {
  return (String(title || '').match(/[A-Za-z]/)?.[0] || 'A').toUpperCase();
}

/**
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} raw
 */
export function resolvePatternSymbolPool(raw) {
  const cfg = { ...TYPE_PATTERN_DEFAULTS, ...raw };
  return filterPosterSymbolPool(cfg.symbolPool ?? TYPE_PATTERN_DEFAULTS.symbolPool);
}

/**
 * Pick one pattern/glyph character — pool roll or title letter (see `typePattern.symbolProbability`).
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} raw
 * @param {string} titleLetter
 * @param {() => number} rand
 * @param {<T>(arr: T[]) => T} pick
 */
export function pickPosterSymbolLetter(raw, titleLetter, rand, pick) {
  const cfg = { ...TYPE_PATTERN_DEFAULTS, ...raw };
  const symbolProb = Math.min(
    1,
    Math.max(0, clampNum(cfg.symbolProbability, TYPE_PATTERN_DEFAULTS.symbolProbability))
  );
  const symbolChars = [...resolvePatternSymbolPool(cfg)];
  return symbolChars.length && rand() < symbolProb ? pick(symbolChars) : titleLetter;
}

/** @param {HTMLElement} card */
export function resolvePosterSurface(card) {
  const cs = getComputedStyle(card);
  return cs.getPropertyValue('--surface').trim() || cs.backgroundColor || '#fff';
}

/**
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} raw
 */
export function resolveBlendModePool(raw) {
  const cfg = { ...TYPE_PATTERN_DEFAULTS, ...raw };
  const allowed = new Set(POSTER_GLYPH_BLEND_MODES);
  const fromArray = Array.isArray(cfg.blendModes)
    ? cfg.blendModes.map((m) => normalizeBlendMode(m)).filter((m) => allowed.has(m) || m === 'source-over')
    : [];
  if (fromArray.length) return fromArray;
  const single = normalizeBlendMode(String(cfg.blendMode ?? TYPE_PATTERN_DEFAULTS.blendMode));
  if (single === 'source-over' || allowed.has(single)) return [single];
  return [TYPE_PATTERN_DEFAULTS.blendMode];
}

/**
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} raw
 * @param {() => number} rand
 * @param {<T>(arr: T[]) => T} pick
 */
export function pickPosterBlendMode(raw, rand, pick) {
  return pick(resolveBlendModePool(raw));
}

function hasFontSizeRange(cfg) {
  const lo = Number(cfg.fontSizeMin);
  const hi = Number(cfg.fontSizeMax);
  return Number.isFinite(lo) && Number.isFinite(hi);
}

/**
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} raw
 * @param {{
 *   rand: () => number;
 *   pick: <T>(arr: T[]) => T;
 *   int: (min: number, max: number) => number;
 *   float: (min: number, max: number) => number;
 *   letter: string;
 *   foregroundColor: string;
 *   fontFamily: string;
 *   fontWeight: string;
 *   width: number;
 *   height: number;
 * }} ctx
 * @param {string} [blendMode] — opacity from `blend.opacity.<mode>`, else appearance fallback
 */
export function buildPosterTypePatternOptions(raw, ctx, blendMode) {
  const cfg = { ...TYPE_PATTERN_DEFAULTS, ...raw };
  const { rand, pick, int, float, letter, foregroundColor, fontFamily, fontWeight, width, height } =
    ctx;

  const types = (
    Array.isArray(cfg.patternTypes) && cfg.patternTypes.length
      ? cfg.patternTypes
      : TYPE_PATTERN_DEFAULTS.patternTypes
  ).filter((t) => PATTERN_TYPES.includes(t));

  const ri = (minKey, maxKey, fallbackMin, fallbackMax, integer = true) => {
    const lo = clampNum(cfg[minKey], fallbackMin);
    const hi = clampNum(cfg[maxKey], fallbackMax);
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    return integer ? int(a, b) : float(a, b);
  };

  let fontSize = null;
  if (hasFontSizeRange(cfg)) {
    fontSize = ri('fontSizeMin', 'fontSizeMax', 12, 72, true);
  }

  const gridColsMin = clampInt(cfg.gridColumnsMin, 3);
  const gridColsMax = Math.max(gridColsMin, clampInt(cfg.gridColumnsMax, 7));
  const staggerProb = Math.min(1, Math.max(0, clampNum(cfg.gridStaggerProbability, 0.6)));

  return {
    letter,
    width,
    height,
    type: pick(types.length ? types : ['wave']),
    repeats: ri('repeatsMin', 'repeatsMax', 18, 38, true),
    fontSize,
    padding: ri('paddingMin', 'paddingMax', 0, 0, true),
    fillSpace: Boolean(cfg.fillSpace),
    opticalTight: cfg.opticalTight !== false,
    tightTracking: ri('tightTrackingMin', 'tightTrackingMax', 0.92, 0.98, false),
    spacing: null,
    followPath: cfg.followPath !== false,
    flipReadable: cfg.flipReadable !== false,
    flipAlternateVertical: Boolean(cfg.flipAlternateVertical),
    flipAlternateHorizontal: Boolean(cfg.flipAlternateHorizontal),
    lineAngle: ri('lineAngleMin', 'lineAngleMax', -25, 25, true),
    startAngle: degToRad(ri('startAngleDegMin', 'startAngleDegMax', -180, 180, true)),
    arcSweep: degToRad(ri('arcSweepDegMin', 'arcSweepDegMax', 63, 360, false)),
    spiralTurns: ri('spiralTurnsMin', 'spiralTurnsMax', 1, 4.5, false),
    waveAmplitude: ri('waveAmplitudeMin', 'waveAmplitudeMax', 0.16, 0.34, false),
    waveCycles: ri('waveCyclesMin', 'waveCyclesMax', 2, 6, true),
    gridColumns: int(gridColsMin, gridColsMax),
    gridStagger: rand() < staggerProb,
    fillAngle: ri('fillAngleMin', 'fillAngleMax', -18, 18, true),
    fillRowGap: ri('fillRowGapMin', 'fillRowGapMax', 1.1, 1.2, false),
    opacity: pickGlyphBlendOpacity(cfg, blendMode ?? '', rand, {
      opacityMin: TYPE_PATTERN_DEFAULTS.opacityMin,
      opacityMax: TYPE_PATTERN_DEFAULTS.opacityMax
    }),
    backgroundColor: 'rgba(0,0,0,0)',
    foregroundColor,
    fontFamily,
    fontWeight
  };
}
