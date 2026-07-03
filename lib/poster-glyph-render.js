/**
 * Render poster glyph patterns / hero glyphs onto canvas layers.
 */

import { renderTypePattern } from './type-pattern.js';
import { computePosterGlyphRegion } from './glyph-region.js';
import {
  buildPosterTypePatternOptions,
  pickPosterBlendMode,
  pickPosterSymbolLetter,
  posterTitleLetter,
  resolvePosterSurface
} from './type-pattern-poster.js';
import { isCanvasBlendMode } from './glyph-blend-opacity.js';
import { resolveTypePatternConfig } from './resolve-graphics-config.js';
import {
  resolveCardHeroGlyphConfig,
  resolveCardPatternConfig
} from './resolve-ground-graphics.js';
import {
  applyHeroGlyph,
  clearHeroGlyph,
  isHeroGlyphAllowed,
  isHeroGlyphFaceAllowed,
  pickHeroGlyphText,
  posterRandFromSlug,
  refitHeroGlyph,
  resolveHeroGlyphConfig,
  shouldUseHeroGlyph
} from './poster-hero-glyph.js';

function clampNum(n, fallback) {
  const v = Number.parseFloat(String(n));
  return Number.isFinite(v) ? v : fallback;
}

/**
 * @param {HTMLElement[]} cards `.post-card` elements
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 */
export function renderPosterGlyphPatterns(cards, cfg) {
  if (!cards?.length) return;
  const globalHeroCfg = resolveHeroGlyphConfig(cfg);

  /** @type {string | null} */
  let previousRegionKey = null;

  for (const card of cards) {
    const patternCfg = resolveCardPatternConfig(cfg, card);
    const heroCfg = resolveCardHeroGlyphConfig(cfg, card);
    const canvas = card.querySelector('[data-glyph-canvas]');
    if (!(canvas instanceof HTMLCanvasElement)) continue;
    const layer = card.querySelector('.post-card__glyph-layer');
    if (!(layer instanceof HTMLElement)) continue;

    const title = (
      card.querySelector('.post-title')?.textContent ||
      card.querySelector('.mini-poster__title')?.textContent ||
      card.querySelector('.landing-mosaic__aside-title')?.textContent ||
      card.dataset.slug ||
      'A'
    ).trim();
    const titleLetter = posterTitleLetter(title);
    const titleEl = card.querySelector(
      '.post-title a, .post-title, .mini-poster__title, .landing-mosaic__aside-title'
    );
    const cs = getComputedStyle(card);
    const titleStyle = titleEl ? getComputedStyle(titleEl) : cs;
    const foregroundColor = cs.getPropertyValue('--glyph-pattern-color').trim() || cs.color || '#111';
    const rand = posterRandFromSlug(card.dataset.slug || title);
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
    const slug = card.dataset.slug || title;
    const heroBlendRand = posterRandFromSlug(`${slug}:hero-blend`);
    const heroOpacityRand = posterRandFromSlug(`${slug}:hero-opacity`);
    const patternBlendRand = posterRandFromSlug(`${slug}:pattern-blend`);
    const heroBlendMode = pickPosterBlendMode(
      heroCfg,
      heroBlendRand,
      (arr) => arr[Math.floor(heroBlendRand() * arr.length)]
    );
    const patternBlendMode = pickPosterBlendMode(
      patternCfg,
      patternBlendRand,
      (arr) => arr[Math.floor(patternBlendRand() * arr.length)]
    );

    const labForce = card.dataset.labGlyph;
    const useHero =
      labForce === 'hero' ||
      (labForce !== 'pattern' &&
        shouldUseHeroGlyph(globalHeroCfg, rand) &&
        isHeroGlyphAllowed(globalHeroCfg) &&
        isHeroGlyphFaceAllowed(globalHeroCfg, card));

    if (useHero) {
      layer.style.removeProperty('--glyph-x');
      layer.style.removeProperty('--glyph-y');
      layer.style.removeProperty('--glyph-w');
      layer.style.removeProperty('--glyph-h');
      applyHeroGlyph(
        card,
        layer,
        canvas,
        heroCfg,
        pickHeroGlyphText(heroCfg, patternCfg, title, rand),
        heroBlendMode,
        rand,
        heroOpacityRand
      );
      continue;
    }

    clearHeroGlyph(card, layer);

    const noneProb = Math.min(1, Math.max(0, clampNum(patternCfg.noneProbability, 0.18)));
    if (labForce !== 'pattern' && rand() < noneProb) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      continue;
    }

    canvas.style.display = 'block';
    canvas.style.opacity = '1';
    layer.dataset.glyphBlendMode = patternBlendMode;
    const patternLetter = pickPosterSymbolLetter(patternCfg, titleLetter, rand, pick);
    const region = computePosterGlyphRegion(card, patternCfg, { slug, previousRegionKey, rand });
    previousRegionKey = region.regionKey;
    layer.style.setProperty('--glyph-y', `${Math.round(region.y)}px`);
    layer.style.setProperty('--glyph-x', `${Math.round(region.x)}px`);
    layer.style.setProperty('--glyph-w', `${Math.max(1, Math.round(region.width))}px`);
    layer.style.setProperty('--glyph-h', `${Math.max(1, Math.round(region.height))}px`);
    const glyphW = Math.max(1, Math.round(region.width));
    const glyphH = Math.max(1, Math.round(region.height));
    const patternUsesBlend = isCanvasBlendMode(patternBlendMode);
    renderTypePattern(canvas, {
      ...buildPosterTypePatternOptions(
        patternCfg,
        {
          rand,
          pick,
          int,
          float: (min, max) => min + rand() * (max - min),
          letter: patternLetter,
          foregroundColor,
          fontFamily: titleStyle.fontFamily,
          fontWeight: titleStyle.fontWeight,
          width: glyphW,
          height: glyphH
        },
        patternBlendMode
      ),
      blendMode: patternUsesBlend ? patternBlendMode : null,
      surfaceColor: patternUsesBlend ? resolvePosterSurface(card) : null,
      backgroundColor: patternUsesBlend ? undefined : 'rgba(0,0,0,0)'
    });
  }

  for (const card of cards) {
    refitHeroGlyph(card, resolveCardHeroGlyphConfig(cfg, card));
  }
}
