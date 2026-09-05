import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroundStylesheet,
  getGroundDefs,
  resolveGroundGlyphTokens,
  setGalleryConfig
} from '../lib/gallery-config.js';
import { HERO_GLYPH_DEFAULTS } from '../lib/poster-hero-glyph.js';
import {
  mergeGroundGlyphIntoPatternConfig,
  mergeGroundHeroGlyphIntoConfig
} from '../lib/resolve-ground-graphics.js';
import {
  normalizeGraphicColorConfig,
  resolveTypePatternConfig
} from '../lib/resolve-graphics-config.js';
import { resolveHeroGlyphConfig } from '../lib/poster-hero-glyph.js';

test('hero glyph defaults to a solid color pool', () => {
  assert.deepEqual(HERO_GLYPH_DEFAULTS.colors, ['#c8102e']);
});

test('normalizeGraphicColorConfig expands colors arrays', () => {
  const flat = normalizeGraphicColorConfig({
    colors: ['#da93aa', '#eda4c9']
  });
  assert.deepEqual(flat.colors, ['#da93aa', '#eda4c9']);
  assert.equal(flat.color, '#da93aa');
});

test('normalizeGraphicColorConfig unifies color aliases into colors[]', () => {
  const flat = normalizeGraphicColorConfig({ glyphColor: 'display' });
  assert.equal(flat.color, 'display');
  assert.deepEqual(flat.colors, ['display']);
  assert.equal(flat.glyphColor, undefined);
});

test('resolveGroundGlyphTokens uses per-ground glyph.colors', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { typePattern: { colors: ['#C8102E'] } } },
    grounds: {
      mint: {
        surface: '#a7dbce',
        foreground: { display: '#004535', body: 'ink' },
        glyph: { colors: ['#004535', '#116655'] }
      }
    }
  });

  const def = cfg.grounds.mint;
  const globalGlyph = { color: '#C8102E', colors: ['#C8102E'], opacity: 1 };
  const tokens = resolveGroundGlyphTokens(def, cfg, globalGlyph);

  assert.equal(tokens.color, '#004535');
  assert.deepEqual(tokens.colors, ['#004535', '#116655']);
  assert.equal(tokens.opacity, 1);
});

test('resolveGroundGlyphTokens falls back to global glyph defaults', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { typePattern: { colors: ['#C8102E'] } } },
    grounds: {
      lime: {
        surface: '#cfec74',
        foreground: { display: '#0c0e10', body: 'ink' }
      }
    }
  });

  const tokens = resolveGroundGlyphTokens(cfg.grounds.lime, cfg, {
    color: '#C8102E',
    colors: ['#C8102E'],
    opacity: 1
  });

  assert.equal(tokens.color, '#C8102E');
  assert.equal(tokens.opacity, 1);
});

test('normalizeGround hoists glyph from foreground for convenience', () => {
  const cfg = setGalleryConfig({
    grounds: {
      lime: {
        surface: '#cfec74',
        foreground: {
          display: '#0c0e10',
          glyph: { colors: ['#6E99FF'] }
        }
      }
    }
  });

  const lime = getGroundDefs(cfg).lime;
  assert.deepEqual(lime.glyph.colors, ['#6E99FF']);
  assert.equal(lime.foreground.glyph, undefined);
});

test('buildGroundStylesheet emits per-ground glyph tokens', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { typePattern: { colors: ['#C8102E'] } } },
    grounds: {
      pink: {
        surface: '#e6c0d6',
        foreground: { display: '#0d0a4f', body: 'ink' },
        glyph: { colors: ['#da93aa', '#eda4c9'] }
      }
    }
  });

  const css = buildGroundStylesheet(cfg);
  assert.match(css, /--on-ground-glyph-pattern-color:#da93aa/i);
  assert.match(css, /--on-ground-glyph-pattern-opacity:1/);
});

test('mergeGroundGlyphIntoPatternConfig overrides colors pool', () => {
  const cfg = setGalleryConfig({
    theme: {
      graphics: {
        typePattern: {
          colors: ['#c8102e']
        }
      }
    },
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: { display: '#2C2781', body: 'ink' },
        glyph: {
          colors: ['#f3f3f5', '#eeeeee']
        }
      }
    }
  });

  const base = resolveTypePatternConfig(cfg);
  const merged = mergeGroundGlyphIntoPatternConfig(base, cfg.grounds.white, cfg);

  assert.deepEqual(merged.colors, ['#f3f3f5', '#eeeeee']);
  assert.equal(merged.color, '#f3f3f5');
});

test('mergeGroundGlyphIntoPatternConfig keeps global colors when ground has no colors', () => {
  const cfg = setGalleryConfig({
    theme: {
      graphics: {
        typePattern: {
          colors: ['#aa0000', '#00aa00']
        }
      }
    },
    grounds: {
      lime: {
        surface: '#cfec74',
        foreground: { display: '#0c0e10', body: 'ink' },
        glyph: {}
      }
    }
  });

  const base = resolveTypePatternConfig(cfg);
  const merged = mergeGroundGlyphIntoPatternConfig(base, cfg.grounds.lime, cfg);

  assert.deepEqual(merged.colors, ['#aa0000', '#00aa00']);
});

test('mergeGroundHeroGlyphIntoConfig overrides colors pool', () => {
  const cfg = setGalleryConfig({
    theme: {
      graphics: {
        heroGlyph: {
          colors: ['#c8102e']
        }
      }
    },
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: { display: '#2C2781', body: 'ink' },
        heroGlyph: {
          colors: ['#f3f3f5']
        }
      }
    }
  });

  const base = resolveHeroGlyphConfig(cfg);
  const merged = mergeGroundHeroGlyphIntoConfig(base, cfg.grounds.white);

  assert.deepEqual(merged.colors, ['#f3f3f5']);
  assert.equal(merged.color, '#f3f3f5');
});

test('normalizeGround hoists heroGlyph from foreground for convenience', () => {
  const cfg = setGalleryConfig({
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: {
          display: '#2C2781',
          heroGlyph: { colors: ['#abcdef'] }
        }
      }
    }
  });

  const white = getGroundDefs(cfg).white;
  assert.deepEqual(white.heroGlyph.colors, ['#abcdef']);
  assert.equal(white.foreground.heroGlyph, undefined);
});
