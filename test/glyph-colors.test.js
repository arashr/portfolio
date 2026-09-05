import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroundStylesheet,
  getGroundDefs,
  resolveGroundGlyphTokens,
  setGalleryConfig
} from '../lib/gallery-config.js';
import { pickGlyphColor, resolveColorPool } from '../lib/glyph-colors.js';
import {
  mergeGroundGlyphIntoPatternConfig,
  mergeGroundHeroGlyphIntoConfig,
  resolveCardHeroGlyphConfig,
  resolveCardPatternConfig
} from '../lib/resolve-ground-graphics.js';
import {
  mergeGraphicColorConfig,
  normalizeGraphicColorConfig,
  resolveGlyphPatternTokens,
  resolveTypePatternConfig
} from '../lib/resolve-graphics-config.js';
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

function loadBundledGalleryConfig() {
  return JSON.parse(readFileSync(path.join(__dirname, '../config/gallery.config.json'), 'utf8'));
}

/** @param {string} groundName */
function mockGroundCard(groundName) {
  const classes = ['post-card', `ground-${groundName}`];
  return {
    classList: {
      [Symbol.iterator]: () => classes[Symbol.iterator](),
      contains: (c) => classes.includes(c)
    },
    dataset: {}
  };
}

/** Grounds in bundled config used as empty-ground fallbacks in tests. */
const SYNTHETIC_EMPTY_GROUNDS = { empty: {} };

test('resolveColorPool prefers colors[] over singular color', () => {
  assert.deepEqual(resolveColorPool({ colors: ['#111', '#222'], color: '#999' }), [
    '#111',
    '#222'
  ]);
  assert.deepEqual(resolveColorPool({ color: '#abc' }), ['#abc']);
});

test('pickGlyphColor is stable for a fixed rand sequence', () => {
  const cfg = { colors: ['#aa0000', '#00aa00', '#0000aa'] };
  const a = pickGlyphColor(cfg, () => 0.1);
  const b = pickGlyphColor(cfg, () => 0.1);
  assert.equal(a, b);
  assert.equal(pickGlyphColor(cfg, () => 0.9), '#0000aa');
});

test('mergeGraphicColorConfig replaces pool when ground defines colors', () => {
  const base = normalizeGraphicColorConfig({ colors: ['#c8102e', '#ffffff'] });
  const overrides = normalizeGraphicColorConfig({ colors: ['#f3f3f5'] });
  const merged = mergeGraphicColorConfig(base, overrides);
  assert.deepEqual(merged.colors, ['#f3f3f5']);
});

test('mergeGraphicColorConfig keeps global pool when ground omits colors', () => {
  const base = normalizeGraphicColorConfig({ colors: ['#aa0000', '#00aa00'] });
  const merged = mergeGraphicColorConfig(base, {});
  assert.deepEqual(merged.colors, ['#aa0000', '#00aa00']);
});

test('resolveGlyphPatternTokens falls back to CSS defaults without config glyph', () => {
  assert.deepEqual(resolveGlyphPatternTokens({}), {
    color: '#c8102e',
    colors: ['#c8102e'],
    opacity: 1
  });
});

test('resolveGroundGlyphTokens uses first color from pool', () => {
  const cfg = setGalleryConfig({});
  const tokens = resolveGroundGlyphTokens(
    { glyph: { colors: ['#004535', '#116655'] } },
    cfg,
    { color: '#c8102e', colors: ['#c8102e'], opacity: 1 }
  );
  assert.equal(tokens.color, '#004535');
  assert.equal(tokens.opacity, 1);
});

test('resolveGroundGlyphTokens inherits global color when ground has no glyph block', () => {
  const cfg = setGalleryConfig({ grounds: { mint: {} } });
  const tokens = resolveGroundGlyphTokens(getGroundDefs(cfg).mint, cfg, {
    color: '#c8102e',
    colors: ['#c8102e'],
    opacity: 1
  });
  assert.equal(tokens.color, '#c8102e');
});

test('resolveHeroGlyphPaint picks from colors pool', () => {
  withComputedStyle({}, () => {
    const card = {};
    assert.equal(
      resolveHeroGlyphPaint(card, { colors: ['#ff00aa', '#00ffaa'] }, () => 0),
      '#ff00aa'
    );
  });
});

test('resolveHeroGlyphPaint resolves legacy semantic paint keys from card CSS vars', () => {
  const vars = {
    '--glyph-pattern-color': '#c8102e',
    '--on-ground-display': '#2c2781',
    '--on-ground-accent': '#b00037'
  };

  withComputedStyle(vars, () => {
    const card = {};
    assert.equal(resolveHeroGlyphPaint(card, { color: 'glyph' }), '#c8102e');
    assert.equal(resolveHeroGlyphPaint(card, { color: 'display' }), '#2c2781');
    assert.equal(resolveHeroGlyphPaint(card, { color: 'accent' }), '#b00037');
    assert.equal(resolveHeroGlyphPaint(card, { color: '#ff00aa' }), '#ff00aa');
  });
});

test('mergeGroundHeroGlyphIntoConfig overrides hero colors', () => {
  const base = resolveHeroGlyphConfig({
    theme: { graphics: { heroGlyph: { colors: ['#c8102e'] } } }
  });
  const merged = mergeGroundHeroGlyphIntoConfig(base, {
    heroGlyph: { colors: ['#abcdef'] }
  });
  assert.deepEqual(merged.colors, ['#abcdef']);
});

test('pickGlyphColor via slug seed is stable', () => {
  const cfg = resolveHeroGlyphConfig(loadBundledGalleryConfig());
  const roll = () => {
    const rand = posterRandFromSlug('figlets-mcp:hero-color');
    return pickGlyphColor(cfg, rand);
  };
  assert.equal(roll(), roll());
});

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
  assert.deepEqual(resolved.colors, globalPattern.colors);
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
  assert.deepEqual(resolved.colors, globalHero.colors);
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

    assert.deepEqual(pattern.colors, globalPattern.colors, `${name} typePattern colors`);
    assert.deepEqual(hero.colors, globalHero.colors, `${name} heroGlyph colors`);
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
});

test('bundled config global typePattern colors', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const pattern = resolveTypePatternConfig(cfg);
  assert.deepEqual(pattern.colors, ['#c8102e']);
});

test('bundled config global heroGlyph colors', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const hero = resolveHeroGlyphConfig(cfg);
  assert.deepEqual(hero.colors, ['#c8102e']);
});

test('bundled config white ground solid color pools', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const globalGlyph = resolveGlyphPatternTokens(cfg);
  const base = resolveTypePatternConfig(cfg);

  const tokens = resolveGroundGlyphTokens(defs.white, cfg, globalGlyph);
  assert.equal(tokens.color, '#f3f3f5');
  assert.equal(tokens.opacity, 1);

  const merged = mergeGroundGlyphIntoPatternConfig(base, defs.white, cfg);
  assert.deepEqual(merged.colors, ['#f3f3f5']);

  const hero = mergeGroundHeroGlyphIntoConfig(resolveHeroGlyphConfig(cfg), defs.white);
  assert.deepEqual(hero.colors, ['#f3f3f5']);
});

test('bundled config pink ground glyph color pools', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  const merged = mergeGroundGlyphIntoPatternConfig(
    resolveTypePatternConfig(cfg),
    defs.pink,
    cfg
  );
  assert.ok(merged.colors.length >= 2);
  assert.match(merged.colors[0], /^#[0-9a-f]{6}$/i);
});

test('bundled config carmine has glyph and heroGlyph color pools', () => {
  const cfg = setGalleryConfig(loadBundledGalleryConfig());
  const defs = getGroundDefs(cfg);
  assert.ok(defs.carmine.glyph?.colors?.length);
  assert.ok(defs.carmine.heroGlyph?.colors?.length);
  assert.deepEqual(
    mergeGroundHeroGlyphIntoConfig(resolveHeroGlyphConfig(cfg), defs.carmine).colors,
    defs.carmine.heroGlyph.colors
  );
});
