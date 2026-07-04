import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroundStylesheet,
  getGroundDefs,
  resolveColor,
  resolveGroundGlyphTokens,
  setGalleryConfig
} from '../lib/gallery-config.js';
import { GROUND_COLOR_DEFAULTS } from '../lib/ground-tokens.js';
import {
  isCanvasBlendMode,
  normalizeBlendMode,
  pickGlyphBlendOpacity,
  resolveBlendOpacityRange
} from '../lib/glyph-blend-opacity.js';
import {
  mergeGroundGlyphIntoPatternConfig,
  mergeGroundHeroGlyphIntoConfig,
  resolveCardHeroGlyphConfig,
  resolveCardPatternConfig
} from '../lib/resolve-ground-graphics.js';
import {
  mergeGraphicBlendConfig,
  normalizeGraphicBlendConfig,
  resolveGlyphPatternTokens,
  resolveTypePatternConfig
} from '../lib/resolve-graphics-config.js';
import { pickPosterBlendMode, resolveBlendModePool } from '../lib/type-pattern-poster.js';
import {
  posterRandFromSlug,
  resolveHeroGlyphConfig,
  resolveHeroGlyphPaint
} from '../lib/poster-hero-glyph.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @param {Record<string, string>} vars */
function withComputedStyle(vars, fn) {
  const prev = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({
    getPropertyValue: (name) => String(vars[name] ?? '').trim()
  });
  try {
    return fn();
  } finally {
    globalThis.getComputedStyle = prev;
  }
}

/** @param {Record<string, unknown>} raw */
function normalizedBlendPool(raw) {
  return [...new Set(resolveBlendModePool(raw).map((m) => normalizeBlendMode(m)))].sort();
}

function loadBundledGalleryConfig() {
  return JSON.parse(readFileSync(path.join(__dirname, '../config/gallery.config.json'), 'utf8'));
}

/** @param {string} groundName */
function mockGroundCard(groundName) {
  const classes = ['post-card', `ground-${groundName}`];
  return {
    classList: {
      [Symbol.iterator]: () => classes[Symbol.iterator]()
    },
    dataset: {}
  };
}

/** Grounds in bundled config used as empty-ground fallbacks in tests. */
const SYNTHETIC_EMPTY_GROUNDS = { empty: {} };

// ── Blend mode normalization ────────────────────────────────────────────────

test('normalizeBlendMode maps plain and normal to source-over', () => {
  assert.equal(normalizeBlendMode('plain'), 'source-over');
  assert.equal(normalizeBlendMode('normal'), 'source-over');
  assert.equal(normalizeBlendMode('difference'), 'difference');
});

test('isCanvasBlendMode treats source-over as non-composite', () => {
  assert.equal(isCanvasBlendMode('plain'), false);
  assert.equal(isCanvasBlendMode('normal'), false);
  assert.equal(isCanvasBlendMode('source-over'), false);
  assert.equal(isCanvasBlendMode('difference'), true);
  assert.equal(isCanvasBlendMode('exclusion'), true);
  assert.equal(isCanvasBlendMode('saturation'), true);
});

test('resolveBlendOpacityRange looks up plain/normal aliases for source-over', () => {
  const cfg = {
    opacityMin: 0.1,
    opacityMax: 0.2,
    blendOpacity: {
      plain: { min: 0.05, max: 0.12 },
      screen: { min: 0.4, max: 0.6 }
    }
  };

  assert.deepEqual(resolveBlendOpacityRange(cfg, 'source-over'), {
    opacityMin: 0.05,
    opacityMax: 0.12
  });
  assert.deepEqual(resolveBlendOpacityRange(cfg, 'normal'), {
    opacityMin: 0.05,
    opacityMax: 0.12
  });
  assert.deepEqual(resolveBlendOpacityRange(cfg, 'screen'), {
    opacityMin: 0.4,
    opacityMax: 0.6
  });
  assert.deepEqual(resolveBlendOpacityRange(cfg, 'multiply'), {
    opacityMin: 0.1,
    opacityMax: 0.2
  });
});

test('pickGlyphBlendOpacity uses per-mode range at rand lower bound', () => {
  const opacity = pickGlyphBlendOpacity(
    {
      blendOpacity: { exclusion: { min: 0.4, max: 0.6 } }
    },
    'exclusion',
    () => 0
  );
  assert.equal(opacity, 0.4);
});

test('resolveBlendModePool normalizes config mode keys', () => {
  const pool = normalizedBlendPool({
    blendModes: ['plain', 'exclusion', 'normal']
  });
  assert.deepEqual(pool, ['exclusion', 'source-over']);
});

test('mergeGraphicBlendConfig restricts pool when ground defines blendModes map', () => {
  const base = {
    blendModes: ['multiply', 'overlay', 'screen'],
    blendOpacity: {
      multiply: { min: 0.01, max: 0.08 },
      overlay: { min: 0.5, max: 0.8 },
      screen: { min: 0.4, max: 0.6 }
    }
  };
  const overrides = normalizeGraphicBlendConfig({
    blendModes: {
      normal: { min: 0.2, max: 0.5 },
      screen: { min: 0.5, max: 0.8 }
    }
  });

  const merged = mergeGraphicBlendConfig(base, overrides);
  assert.deepEqual(merged.blendModes, ['normal', 'screen']);
  assert.equal(merged.blendOpacity.screen.min, 0.5);
  // Base per-mode opacity table is retained; only the roll pool is restricted.
  assert.equal(merged.blendOpacity.multiply.min, 0.01);
  assert.equal(merged.blendModes.includes('multiply'), false);
});

test('mergeGraphicBlendConfig keeps global pool when ground omits blendModes', () => {
  const base = normalizeGraphicBlendConfig({
    blendModes: {
      multiply: { min: 0.01, max: 0.08 },
      overlay: { min: 0.5, max: 0.8 }
    }
  });
  const merged = mergeGraphicBlendConfig(base, { opacity: 0.2 });
  assert.deepEqual(merged.blendModes, ['multiply', 'overlay']);
});

// ── Glyph colors ────────────────────────────────────────────────────────────

test('resolveGlyphPatternTokens falls back to CSS defaults without config glyph', () => {
  assert.deepEqual(resolveGlyphPatternTokens({}), {
    color: '#c8102e',
    opacity: 0.07
  });
});

test('resolveGroundGlyphTokens resolves semantic and ground token colors', () => {
  const cfg = setGalleryConfig({});
  const globalGlyph = { color: '#c8102e', opacity: 0.07 };

  const displayTokens = resolveGroundGlyphTokens(
    {
      foreground: { display: 'ground-white-display' },
      glyph: { color: 'display' }
    },
    cfg,
    globalGlyph
  );
  assert.equal(displayTokens.color, GROUND_COLOR_DEFAULTS['ground-white-display']);

  const redTokens = resolveGroundGlyphTokens(
    {
      foreground: { display: 'ground-white-display' },
      glyph: { color: 'red', opacity: 0.5 }
    },
    cfg,
    globalGlyph
  );
  assert.equal(redTokens.color, resolveColor('red', cfg));
  assert.equal(redTokens.opacity, 0.5);

  const hexTokens = resolveGroundGlyphTokens(
    {
      glyph: { color: '#004535', opacity: 0.12 }
    },
    cfg,
    globalGlyph
  );
  assert.equal(hexTokens.color, '#004535');
  assert.equal(hexTokens.opacity, 0.12);
});

test('resolveGroundGlyphTokens uses opacity range midpoint when opacity is omitted', () => {
  const tokens = resolveGroundGlyphTokens(
    {
      glyph: { opacityMin: 0.3, opacityMax: 0.5 }
    },
    setGalleryConfig({}),
    { color: '#c8102e', opacity: 0.07 }
  );
  assert.equal(tokens.opacity, 0.4);
});

test('resolveGroundGlyphTokens inherits global color when glyph omits color', () => {
  const cfg = setGalleryConfig({});
  const tokens = resolveGroundGlyphTokens(
    { glyph: { opacity: 0.09 } },
    cfg,
    { color: 'red', opacity: 0.07 }
  );
  assert.equal(tokens.color, resolveColor('red', cfg));
});

test('resolveGroundGlyphTokens inherits global color when ground has no glyph block', () => {
  const cfg = setGalleryConfig({ grounds: { mint: {} } });
  const tokens = resolveGroundGlyphTokens(getGroundDefs(cfg).mint, cfg, {
    color: '#c8102e',
    opacity: 0.07
  });
  assert.equal(tokens.color, '#c8102e');
});

// ── Hero glyph colors ───────────────────────────────────────────────────────

test('resolveHeroGlyphPaint resolves semantic paint keys from card CSS vars', () => {
  const vars = {
    '--glyph-pattern-color': '#c8102e',
    '--on-ground-display': '#2c2781',
    '--on-ground-accent': '#b00037'
  };

  withComputedStyle(vars, () => {
    const card = {};
    assert.equal(resolveHeroGlyphPaint(card, { color: 'glyph' }), '#c8102e');
    assert.equal(resolveHeroGlyphPaint(card, { color: 'pattern' }), '#c8102e');
    assert.equal(resolveHeroGlyphPaint(card, { color: 'display' }), '#2c2781');
    assert.equal(resolveHeroGlyphPaint(card, { color: 'accent' }), '#b00037');
    assert.equal(resolveHeroGlyphPaint(card, { color: '#ff00aa' }), '#ff00aa');
    assert.equal(resolveHeroGlyphPaint(card, { color: 'white' }), 'white');
  });
});

test('mergeGroundHeroGlyphIntoConfig overrides hero color string', () => {
  const base = resolveHeroGlyphConfig({
    theme: { graphics: { heroGlyph: { color: 'glyph' } } }
  });
  const merged = mergeGroundHeroGlyphIntoConfig(base, {
    heroGlyph: { color: 'display' }
  });
  assert.equal(merged.color, 'display');
});

// ── Deterministic blend rolls ───────────────────────────────────────────────

test('pickPosterBlendMode is stable for a fixed slug', () => {
  const cfg = resolveHeroGlyphConfig(loadBundledGalleryConfig());
  const roll = () => {
    const rand = posterRandFromSlug('figlets-mcp');
    return pickPosterBlendMode(cfg, rand, (arr) => arr[Math.floor(rand() * arr.length)]);
  };
  assert.equal(roll(), roll());
});

// ── Empty ground → global fallback ──────────────────────────────────────────

test('normalizeGround omits glyph and heroGlyph when ground entry is empty', () => {
  const cfg = setGalleryConfig({ grounds: { pink: {}, butter: {} } });
  for (const name of ['pink', 'butter']) {
    const def = getGroundDefs(cfg)[name];
    assert.equal(def.glyph, undefined, `${name} must not get a glyph object`);
    assert.equal(def.heroGlyph, undefined, `${name} must not get a heroGlyph object`);
    assert.equal(def.surface, `ground-${name}`);
  }
});

test('mergeGroundGlyphIntoPatternConfig returns global config when ground has no glyph', () => {
  const cfg = setGalleryConfig({
    ...loadBundledGalleryConfig(),
    grounds: { ...loadBundledGalleryConfig().grounds, ...SYNTHETIC_EMPTY_GROUNDS }
  });
  const globalPattern = resolveTypePatternConfig(cfg);
  const def = getGroundDefs(cfg).empty;

  const resolved = mergeGroundGlyphIntoPatternConfig(globalPattern, def, cfg);
  assert.equal(resolved, globalPattern);
  assert.deepEqual(normalizedBlendPool(resolved), normalizedBlendPool(globalPattern));
  assert.deepEqual(resolveBlendOpacityRange(resolved, 'exclusion'), {
    opacityMin: 0.4,
    opacityMax: 0.6
  });
});

test('mergeGroundHeroGlyphIntoConfig returns global config when ground has no heroGlyph', () => {
  const cfg = setGalleryConfig({
    ...loadBundledGalleryConfig(),
    grounds: { ...loadBundledGalleryConfig().grounds, ...SYNTHETIC_EMPTY_GROUNDS }
  });
  const globalHero = resolveHeroGlyphConfig(cfg);
  const def = getGroundDefs(cfg).empty;

  const resolved = mergeGroundHeroGlyphIntoConfig(globalHero, def);
  assert.equal(resolved, globalHero);
  assert.equal(resolved.color, 'glyph');
  assert.deepEqual(normalizedBlendPool(resolved), normalizedBlendPool(globalHero));
  assert.deepEqual(resolveBlendOpacityRange(resolved, 'difference'), {
    opacityMin: 0.2,
    opacityMax: 0.4
  });
});

test('ground with only heroGlyph still falls back to global typePattern', () => {
  const cfg = setGalleryConfig({
    ...loadBundledGalleryConfig(),
    grounds: {
      ...loadBundledGalleryConfig().grounds,
      lime: {
        heroGlyph: {
          opacityMin: 0.2,
          opacityMax: 0.4,
          blendModes: { exclusion: { min: 0.6, max: 0.9 } }
        }
      }
    }
  });
  const globalPattern = resolveTypePatternConfig(cfg);
  const lime = getGroundDefs(cfg).lime;

  assert.equal(lime.glyph, undefined);
  assert.ok(lime.heroGlyph);

  const pattern = mergeGroundGlyphIntoPatternConfig(globalPattern, lime, cfg);
  assert.equal(pattern, globalPattern);
  assert.deepEqual(
    resolveBlendOpacityRange(pattern, 'multiply'),
    resolveBlendOpacityRange(globalPattern, 'multiply')
  );
});

test('ground with only glyph still falls back to global heroGlyph', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const globalHero = resolveHeroGlyphConfig(cfg);
  const carmine = getGroundDefs(cfg).carmine;

  assert.ok(carmine.glyph);
  assert.equal(carmine.heroGlyph, undefined);

  const hero = mergeGroundHeroGlyphIntoConfig(globalHero, carmine);
  assert.equal(hero, globalHero);
  assert.deepEqual(
    resolveBlendOpacityRange(hero, 'overlay'),
    resolveBlendOpacityRange(globalHero, 'overlay')
  );
});

test('resolveCardPatternConfig and resolveCardHeroGlyphConfig fall back for empty grounds', () => {
  const cfg = setGalleryConfig({
    ...loadBundledGalleryConfig(),
    grounds: { ...loadBundledGalleryConfig().grounds, ...SYNTHETIC_EMPTY_GROUNDS }
  });
  const globalPattern = resolveTypePatternConfig(cfg);
  const globalHero = resolveHeroGlyphConfig(cfg);

  for (const name of Object.keys(SYNTHETIC_EMPTY_GROUNDS)) {
    const card = mockGroundCard(name);
    const pattern = resolveCardPatternConfig(cfg, card);
    const hero = resolveCardHeroGlyphConfig(cfg, card);

    assert.deepEqual(
      normalizedBlendPool(pattern),
      normalizedBlendPool(globalPattern),
      `${name} typePattern blend pool should match global`
    );
    assert.deepEqual(
      resolveBlendOpacityRange(pattern, 'exclusion'),
      resolveBlendOpacityRange(globalPattern, 'exclusion'),
      `${name} typePattern per-mode opacity should match global`
    );
    assert.equal(hero.color, globalHero.color, `${name} heroGlyph color should match global`);
    assert.deepEqual(
      normalizedBlendPool(hero),
      normalizedBlendPool(globalHero),
      `${name} heroGlyph blend pool should match global`
    );
  }
});

test('buildGroundStylesheet injects reader-only glyph CSS for empty mint', () => {
  const cfg = setGalleryConfig({
    ...loadBundledGalleryConfig(),
    grounds: { ...loadBundledGalleryConfig().grounds, mint: {} }
  });
  const globalGlyph = resolveGlyphPatternTokens(cfg);
  const css = buildGroundStylesheet(cfg);

  assert.match(
    css,
    new RegExp(
      `#main-reader \\.post-card\\.ground-mint\\{--on-ground-glyph-pattern-color:${globalGlyph.color}`,
      'i'
    )
  );
  assert.equal(
    css.split('\n').some((line) => line.startsWith('.ground-empty{--on-ground-glyph-pattern')),
    false,
    'synthetic empty ground must not get bare glyph CSS'
  );
  const mintGlyphLines = css
    .split('\n')
    .filter((line) => line.includes('ground-mint') && line.includes('--on-ground-glyph-pattern'));
  assert.equal(mintGlyphLines.length, 1);
  assert.match(mintGlyphLines[0], /^#main-reader /);
});

test('bundled empty grounds inherit global CSS glyph tokens', () => {
  const cfg = setGalleryConfig({
    ...loadBundledGalleryConfig(),
    grounds: { ...loadBundledGalleryConfig().grounds, ...SYNTHETIC_EMPTY_GROUNDS }
  });
  const globalGlyph = resolveGlyphPatternTokens(cfg);

  for (const name of Object.keys(SYNTHETIC_EMPTY_GROUNDS)) {
    const tokens = resolveGroundGlyphTokens(getGroundDefs(cfg)[name], cfg, globalGlyph);
    assert.deepEqual(
      tokens,
      { color: globalGlyph.color, opacity: globalGlyph.opacity },
      `${name} CSS glyph tokens should match global`
    );
  }
});

// ── Bundled gallery.config.json contract ────────────────────────────────────

test('bundled config global typePattern blend pool', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const pattern = resolveTypePatternConfig(cfg);
  assert.deepEqual(normalizedBlendPool(pattern), [
    'color-dodge',
    'exclusion',
    'multiply',
    'overlay',
    'screen'
  ]);
  assert.deepEqual(resolveBlendOpacityRange(pattern, 'exclusion'), {
    opacityMin: 0.4,
    opacityMax: 0.6
  });
  assert.deepEqual(resolveBlendOpacityRange(pattern, 'multiply'), {
    opacityMin: 0.01,
    opacityMax: 0.08
  });
});

test('bundled config global heroGlyph blend pool', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const hero = resolveHeroGlyphConfig(cfg);
  assert.equal(hero.color, 'glyph');
  assert.deepEqual(normalizedBlendPool(hero), [
    'color-dodge',
    'difference',
    'exclusion',
    'overlay',
    'screen'
  ]);
  assert.deepEqual(resolveBlendOpacityRange(hero, 'difference'), {
    opacityMin: 0.2,
    opacityMax: 0.4
  });
});

test('bundled config white ground glyph colors and restricted blend pool', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const globalGlyph = resolveGlyphPatternTokens(cfg);
  const base = resolveTypePatternConfig(cfg);

  const tokens = resolveGroundGlyphTokens(defs.white, cfg, globalGlyph);
  assert.equal(tokens.color, 'white');
  assert.equal(tokens.opacity, 0.5);

  const merged = mergeGroundGlyphIntoPatternConfig(base, defs.white, cfg);
  assert.deepEqual(normalizedBlendPool(merged), ['screen']);
  assert.deepEqual(resolveBlendOpacityRange(merged, 'screen'), {
    opacityMin: 0.4,
    opacityMax: 0.6
  });
  assert.equal(merged.blendModes.includes('multiply'), false);
  assert.equal(merged.blendModes.includes('exclusion'), false);
});

test('bundled config white ground heroGlyph colors and restricted blend pool', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const base = resolveHeroGlyphConfig(cfg);
  const merged = mergeGroundHeroGlyphIntoConfig(base, defs.white);

  assert.equal(merged.color, 'white');
  assert.deepEqual(normalizedBlendPool(merged), ['screen']);
  assert.deepEqual(resolveBlendOpacityRange(merged, 'screen'), {
    opacityMin: 0.4,
    opacityMax: 0.6
  });
  assert.equal(merged.blendModes.includes('difference'), false);
});

test('bundled config per-ground glyph blend restrictions', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const base = resolveTypePatternConfig(cfg);

  assert.deepEqual(
    normalizedBlendPool(mergeGroundGlyphIntoPatternConfig(base, defs.tangerine, cfg)),
    ['exclusion', 'multiply', 'overlay', 'soft-light', 'source-over']
  );
  assert.deepEqual(
    normalizedBlendPool(mergeGroundGlyphIntoPatternConfig(base, defs.lilac, cfg)),
    ['overlay', 'screen']
  );
  assert.deepEqual(
    normalizedBlendPool(mergeGroundGlyphIntoPatternConfig(base, defs.pink, cfg)),
    ['exclusion', 'screen']
  );
  assert.deepEqual(
    normalizedBlendPool(mergeGroundGlyphIntoPatternConfig(base, defs.mint, cfg)),
    ['exclusion', 'overlay']
  );
});

test('bundled config lime ground heroGlyph blend restriction', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const merged = mergeGroundHeroGlyphIntoConfig(resolveHeroGlyphConfig(cfg), defs.lime);

  assert.deepEqual(normalizedBlendPool(merged), ['exclusion', 'saturation', 'screen']);
  assert.equal(merged.color, 'glyph');
  assert.equal(merged.blendModes.includes('difference'), false);
});

test('bundled config carmine inherits global heroGlyph when ground omits heroGlyph', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const globalHero = resolveHeroGlyphConfig(cfg);
  const carmine = getGroundDefs(cfg).carmine;

  assert.ok(carmine.glyph);
  assert.equal(carmine.heroGlyph, undefined);
  assert.equal(mergeGroundHeroGlyphIntoConfig(globalHero, carmine), globalHero);
});

test('bundled config carmine ground glyph opacity and blend pool', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const globalGlyph = resolveGlyphPatternTokens(cfg);
  const base = resolveTypePatternConfig(cfg);

  const tokens = resolveGroundGlyphTokens(defs.carmine, cfg, globalGlyph);
  assert.equal(tokens.color, globalGlyph.color);
  assert.equal(tokens.opacity, 0.2);

  const merged = mergeGroundGlyphIntoPatternConfig(base, defs.carmine, cfg);
  assert.deepEqual(normalizedBlendPool(merged), ['color-dodge', 'multiply', 'overlay']);
});
