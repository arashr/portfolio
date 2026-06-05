/**
 * Huge background glyph posters — alternative to mini type patterns.
 * Config: `theme.graphics.heroGlyph` (see HERO_GLYPH_DEFAULTS).
 * Symbol source: `theme.graphics.typePattern.symbolPool` + `symbolProbability`.
 *
 * Blend is baked on canvas (globalCompositeOperation) because CSS mix-blend-mode
 * is broken by transform on `.post-card-wrap.reveal`.
 */

import { pickPosterSymbolLetter, posterTitleLetter, resolvePosterSurface } from './type-pattern-poster.js';
import { pickGlyphBlendOpacity } from './glyph-blend-opacity.js';
import { applyAppearanceOpacityFallback, flattenHeroGlyphConfig } from './resolve-graphics-config.js';

export const HERO_GLYPH_DEFAULTS = {
  probability: 0.22,
  lengthMin: 1,
  lengthMax: 2,
  glyphColor: 'display',
  sizeRatio: 0.98,
  opacity: 1,
  blendMode: 'difference',
  blendModes: ['difference', 'exclusion', 'multiply', 'overlay'],
  /** Title face ids (`fonts.titleFaces[].id`) that never get a mega-glyph. */
  excludeTitleFaces: [],
  /** Horizontal shift as fraction of card width; negative = left, positive = right. */
  offsetXRatioMin: -0.28,
  offsetXRatioMax: 0.28,
  /** Skip mega-glyph when OS asks for reduced transparency (DESIGN.md). */
  respectReducedTransparency: true,
  /** Skip mega-glyph when OS asks for higher contrast. */
  respectHighContrast: true
};

/** @param {string} slug */
export function posterRandFromSlug(slug) {
  const seedBase = String(slug || 'poster')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let s = seedBase >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveHeroGlyphConfig(cfg) {
  const raw = cfg?.theme?.graphics?.heroGlyph;
  const flat = flattenHeroGlyphConfig(cfg);
  applyAppearanceOpacityFallback(flat, raw?.appearance, undefined, HERO_GLYPH_DEFAULTS.opacity);
  return { ...HERO_GLYPH_DEFAULTS, ...flat };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveHeroGlyphOptions(cfg) {
  const nested = resolveHeroGlyphConfig(cfg);
  const lengthMin = clampInt(nested.lengthMin, HERO_GLYPH_DEFAULTS.lengthMin, 1, 6);
  const lengthMax = clampInt(nested.lengthMax, HERO_GLYPH_DEFAULTS.lengthMax, lengthMin, 8);

  return {
    probability: clampNum(nested.probability, HERO_GLYPH_DEFAULTS.probability, 0, 1),
    lengthMin,
    lengthMax,
    glyphColor: String(nested.glyphColor ?? nested.titleColor ?? HERO_GLYPH_DEFAULTS.glyphColor),
    sizeRatio: clampNum(nested.sizeRatio, HERO_GLYPH_DEFAULTS.sizeRatio, 0.4, 1.2),
    excludeTitleFaces: Array.isArray(nested.excludeTitleFaces)
      ? nested.excludeTitleFaces.map((id) => String(id))
      : [...HERO_GLYPH_DEFAULTS.excludeTitleFaces],
    offsetXRatioMin: clampNum(
      nested.offsetXRatioMin,
      HERO_GLYPH_DEFAULTS.offsetXRatioMin,
      -1.5,
      1.5
    ),
    offsetXRatioMax: clampNum(
      nested.offsetXRatioMax,
      HERO_GLYPH_DEFAULTS.offsetXRatioMax,
      -1.5,
      1.5
    ),
    respectReducedTransparency: nested.respectReducedTransparency !== false,
    respectHighContrast: nested.respectHighContrast !== false
  };
}

/**
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} opts
 * @param {() => number} rand
 */
export function shouldUseHeroGlyph(opts, rand) {
  return rand() < opts.probability;
}

/**
 * OS / readability gates — mega-glyphs are decorative; skip when the user asks for less visual noise.
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} opts
 * @param {{ matchMedia?: (q: string) => { matches: boolean } }} [env]
 */
export function isHeroGlyphAllowed(opts, env = typeof globalThis !== 'undefined' ? globalThis : undefined) {
  const mq = env?.matchMedia;
  if (typeof mq !== 'function') return true;
  if (opts.respectReducedTransparency !== false && mq('(prefers-reduced-transparency: reduce)').matches) {
    return false;
  }
  if (opts.respectHighContrast !== false && mq('(prefers-contrast: more)').matches) {
    return false;
  }
  return true;
}

/** @param {HTMLElement} card */
export function posterTitleFaceId(card) {
  if (!card) return null;
  const match = String(card.className).match(/\btitle-face-([\w-]+)\b/);
  return match?.[1] ?? null;
}

/**
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} opts
 * @param {HTMLElement} card
 */
export function isHeroGlyphFaceAllowed(opts, card) {
  const exclude = opts.excludeTitleFaces;
  if (!exclude?.length) return true;
  const faceId = posterTitleFaceId(card);
  if (!faceId) return true;
  return !exclude.includes(faceId);
}

/**
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} opts
 * @param {number} cardW
 * @param {() => number} rand
 */
export function pickHeroGlyphOffsetX(opts, cardW, rand) {
  const lo = Math.min(opts.offsetXRatioMin, opts.offsetXRatioMax);
  const hi = Math.max(opts.offsetXRatioMin, opts.offsetXRatioMax);
  const w = Math.max(1, cardW);
  return w * (lo + rand() * (hi - lo));
}

/**
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} heroOpts
 * @param {Record<string, unknown>} patternCfg
 * @param {string} title
 * @param {() => number} rand
 */
export function pickHeroGlyphText(heroOpts, patternCfg, title, rand) {
  const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const titleLetter = posterTitleLetter(title);
  const len = int(heroOpts.lengthMin, heroOpts.lengthMax);

  let out = '';
  for (let i = 0; i < len; i++) {
    out += pickPosterSymbolLetter(patternCfg, titleLetter, rand, pick);
  }
  return out || titleLetter;
}

/**
 * @param {number} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 */
function clampNum(value, fallback, min, max) {
  const n = Number.parseFloat(String(value));
  const v = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}

/**
 * @param {number} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 */
function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(String(value), 10);
  const v = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}

/**
 * @param {HTMLElement} card
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} opts
 */
export function resolveHeroGlyphPaint(card, opts) {
  const key = String(opts.glyphColor);
  if (key === 'display') {
    return getComputedStyle(card).getPropertyValue('--on-ground-display').trim() || '#111154';
  }
  if (key === 'accent') {
    const cs = getComputedStyle(card);
    return cs.getPropertyValue('--on-ground-accent').trim() || cs.getPropertyValue('--on-ground-display').trim() || '#111';
  }
  return key;
}

/** @param {HTMLElement} card */
export function resolveHeroGlyphSurface(card) {
  return resolvePosterSurface(card);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} sizePx
 * @param {CSSStyleDeclaration} titleStyle
 */
function applyHeroGlyphFont(ctx, sizePx, titleStyle) {
  const weight = titleStyle.fontWeight || '700';
  const family = titleStyle.fontFamily || 'serif';
  ctx.font = `${weight} ${sizePx}px ${family}`;
  const spacing = titleStyle.letterSpacing;
  if (spacing && spacing !== 'normal' && 'letterSpacing' in ctx) {
    ctx.letterSpacing = spacing;
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} targetW
 * @param {CSSStyleDeclaration} titleStyle
 * @param {number} maxHi
 */
export function fitHeroGlyphFontSize(ctx, text, targetW, titleStyle, maxHi) {
  let lo = 12;
  let hi = Math.max(24, maxHi);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    applyHeroGlyphFont(ctx, mid, titleStyle);
    const w = ctx.measureText(text).width;
    if (w > targetW) hi = mid - 1;
    else lo = mid;
  }
  return Math.max(12, lo);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} card
 * @param {ReturnType<typeof resolveHeroGlyphOptions>} opts
 * @param {string} text
 * @param {string} blendMode
 * @param {number} [offsetX=0]
 * @param {number} [opacity=1]
 */
export function renderHeroGlyphCanvas(canvas, card, opts, text, blendMode, offsetX = 0, opacity = 1) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, card.clientWidth);
  const h = Math.max(1, card.clientHeight);

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.display = 'block';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.opacity = '1';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = resolveHeroGlyphSurface(card);
  ctx.fillRect(0, 0, w, h);

  const titleEl = card.querySelector('.post-title');
  const titleStyle = titleEl ? getComputedStyle(titleEl) : getComputedStyle(card);
  const widthRatio = Math.min(1.2, Math.max(0.4, opts.sizeRatio));
  const targetW = w * widthRatio;
  const fontSize = fitHeroGlyphFontSize(
    ctx,
    text,
    targetW,
    titleStyle,
    Math.round(targetW * 1.4)
  );

  ctx.globalCompositeOperation = blendMode;
  ctx.fillStyle = resolveHeroGlyphPaint(card, opts);
  applyHeroGlyphFont(ctx, fontSize, titleStyle);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = Math.min(1, Math.max(0, opacity));
  ctx.fillText(text, w / 2 + offsetX, h / 2);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * @param {ReturnType<typeof resolveHeroGlyphConfig>} heroCfg
 * @param {HTMLElement} card
 * @param {string} blendMode
 * @param {() => number} layoutRand
 * @param {() => number} opacityRand
 */
export function resolveHeroGlyphPaintState(card, heroCfg, blendMode, layoutRand, opacityRand) {
  return {
    offsetX: pickHeroGlyphOffsetX(heroCfg, card.clientWidth, layoutRand),
    opacity: pickGlyphBlendOpacity(heroCfg, blendMode, opacityRand)
  };
}

/**
 * @param {HTMLElement} card
 * @param {HTMLElement} layer
 * @param {HTMLCanvasElement} canvas
 * @param {ReturnType<typeof resolveHeroGlyphConfig>} heroCfg
 * @param {string} text
 * @param {string} blendMode
 * @param {() => number} layoutRand
 * @param {() => number} opacityRand
 */
export function applyHeroGlyph(card, layer, canvas, heroCfg, text, blendMode, layoutRand, opacityRand) {
  layer.classList.add('post-card__glyph-layer--hero');
  card.classList.add('post-card--hero-glyph');
  layer.dataset.heroGlyphText = text;
  layer.dataset.glyphBlendMode = blendMode;
  const { offsetX, opacity } = resolveHeroGlyphPaintState(
    card,
    heroCfg,
    blendMode,
    layoutRand,
    opacityRand
  );
  renderHeroGlyphCanvas(canvas, card, heroCfg, text, blendMode, offsetX, opacity);
}

/** @param {HTMLElement} card @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function refitHeroGlyph(card, cfg) {
  if (!card.classList.contains('post-card--hero-glyph')) return;
  const layer = card.querySelector('.post-card__glyph-layer');
  const canvas = card.querySelector('[data-glyph-canvas]');
  const text = layer instanceof HTMLElement ? layer.dataset.heroGlyphText : '';
  if (!(layer instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !text) return;
  const opts = resolveHeroGlyphConfig(cfg);
  const blendMode = layer.dataset.glyphBlendMode || 'difference';
  const slug = card.dataset.slug || text;
  const layoutRand = posterRandFromSlug(slug);
  const opacityRand = posterRandFromSlug(`${slug}:hero-opacity`);
  const { offsetX, opacity } = resolveHeroGlyphPaintState(
    card,
    opts,
    blendMode,
    layoutRand,
    opacityRand
  );
  renderHeroGlyphCanvas(canvas, card, opts, text, blendMode, offsetX, opacity);
}

/** @param {HTMLElement} card @param {HTMLElement} layer */
export function clearHeroGlyph(card, layer) {
  layer.classList.remove('post-card__glyph-layer--hero');
  card.classList.remove('post-card--hero-glyph');
  delete layer.dataset.heroGlyphText;
  delete layer.dataset.glyphBlendMode;
  const canvas = layer.querySelector('[data-glyph-canvas]');
  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
    canvas.style.opacity = '';
    canvas.style.left = '';
    canvas.style.top = '';
    canvas.style.width = '';
    canvas.style.height = '';
  }
}
