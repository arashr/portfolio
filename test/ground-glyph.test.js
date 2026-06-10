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
  normalizeGraphicBlendConfig,
  resolveTypePatternConfig
} from '../lib/resolve-graphics-config.js';
import { resolveHeroGlyphConfig } from '../lib/poster-hero-glyph.js';

test('hero glyph defaults to ground glyph color semantic', () => {
  assert.equal(HERO_GLYPH_DEFAULTS.color, 'glyph');
});

test('normalizeGraphicBlendConfig expands object blendModes', () => {
  const flat = normalizeGraphicBlendConfig({
    blendModes: {
      overlay: { min: 0.5, max: 0.8 },
      screen: { min: 0.4, max: 0.6 }
    }
  });

  assert.deepEqual(flat.blendModes, ['overlay', 'screen']);
  assert.equal(flat.blendOpacity.overlay.min, 0.5);
  assert.equal(flat.blendOpacity.screen.max, 0.6);
  assert.equal(flat._blendModesFromMap, true);
});

test('normalizeGraphicBlendConfig unifies color aliases', () => {
  const flat = normalizeGraphicBlendConfig({ glyphColor: 'display' });
  assert.equal(flat.color, 'display');
  assert.equal(flat.glyphColor, undefined);
});

test('resolveGroundGlyphTokens uses per-ground glyph.color', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { glyph: { color: '#C8102E', opacity: 0.07 } } },
    grounds: {
      mint: {
        surface: '#a7dbce',
        foreground: { display: '#004535', body: 'ink' },
        glyph: { color: '#004535', opacity: 0.12 }
      }
    }
  });

  const def = cfg.grounds.mint;
  const globalGlyph = { color: '#C8102E', opacity: 0.07 };
  const tokens = resolveGroundGlyphTokens(def, cfg, globalGlyph);

  assert.equal(tokens.color, '#004535');
  assert.equal(tokens.opacity, 0.12);
});

test('resolveGroundGlyphTokens falls back to global glyph defaults', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { glyph: { color: '#C8102E', opacity: 0.07 } } },
    grounds: {
      lime: {
        surface: '#cfec74',
        foreground: { display: '#0c0e10', body: 'ink' }
      }
    }
  });

  const tokens = resolveGroundGlyphTokens(cfg.grounds.lime, cfg, {
    color: '#C8102E',
    opacity: 0.07
  });

  assert.equal(tokens.color, '#C8102E');
  assert.equal(tokens.opacity, 0.07);
});

test('normalizeGround hoists glyph from foreground for convenience', () => {
  const cfg = setGalleryConfig({
    grounds: {
      lime: {
        surface: '#cfec74',
        foreground: {
          display: '#0c0e10',
          glyph: { color: '#6E99FF', opacity: 0.09 }
        }
      }
    }
  });

  const lime = getGroundDefs(cfg).lime;
  assert.equal(lime.glyph.color, '#6E99FF');
  assert.equal(lime.foreground.glyph, undefined);
});

test('buildGroundStylesheet emits per-ground glyph tokens', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { glyph: { color: '#C8102E', opacity: 0.07 } } },
    grounds: {
      pink: {
        surface: '#e6c0d6',
        foreground: { display: '#0d0a4f', body: 'ink' },
        glyph: { color: 'ground-pink-accent' }
      }
    }
  });

  const css = buildGroundStylesheet(cfg);
  assert.match(css, /--on-ground-glyph-pattern-color:#5c1028/i);
});

test('resolveGroundGlyphTokens uses opacity range midpoint for CSS', () => {
  const cfg = setGalleryConfig({
    theme: { graphics: { glyph: { color: '#C8102E', opacity: 0.07 } } },
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: { display: '#2C2781', body: 'ink' },
        glyph: { opacityMin: 0.2, opacityMax: 0.6 }
      }
    }
  });

  const tokens = resolveGroundGlyphTokens(cfg.grounds.white, cfg, {
    color: '#C8102E',
    opacity: 0.07
  });

  assert.equal(tokens.opacity, 0.4);
});

test('mergeGroundGlyphIntoPatternConfig overrides blendModes map', () => {
  const cfg = setGalleryConfig({
    theme: {
      graphics: {
        typePattern: {
          appearance: { opacityMin: 0.1, opacityMax: 0.2 },
          blendModes: {
            multiply: { min: 0.05, max: 0.1 }
          }
        }
      }
    },
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: { display: '#2C2781', body: 'ink' },
        glyph: {
          opacityMin: 0.3,
          opacityMax: 0.5,
          blendModes: {
            exclusion: { min: 0.4, max: 0.6 },
            screen: { min: 0.45, max: 0.55 }
          }
        }
      }
    }
  });

  const base = resolveTypePatternConfig(cfg);
  const merged = mergeGroundGlyphIntoPatternConfig(base, cfg.grounds.white, cfg);

  assert.deepEqual(merged.blendModes, ['exclusion', 'screen']);
  assert.equal(merged.opacityMin, 0.3);
  assert.equal(merged.opacityMax, 0.5);
  assert.equal(merged.blendOpacity.exclusion.min, 0.4);
  assert.equal(merged.blendOpacity.exclusion.max, 0.6);
  assert.equal(merged.blendModes.includes('multiply'), false);
});

test('mergeGroundGlyphIntoPatternConfig keeps global pool when ground has no blendModes', () => {
  const cfg = setGalleryConfig({
    theme: {
      graphics: {
        typePattern: {
          blendModes: {
            multiply: { min: 0.05, max: 0.1 },
            overlay: { min: 0.5, max: 0.8 }
          }
        }
      }
    },
    grounds: {
      lime: {
        surface: '#cfec74',
        foreground: { display: '#0c0e10', body: 'ink' },
        glyph: { opacity: 0.09 }
      }
    }
  });

  const base = resolveTypePatternConfig(cfg);
  const merged = mergeGroundGlyphIntoPatternConfig(base, cfg.grounds.lime, cfg);

  assert.deepEqual(merged.blendModes, ['multiply', 'overlay']);
  assert.equal(merged.blendOpacity.multiply.min, 0.05);
  assert.equal(merged.blendOpacity.overlay.max, 0.8);
});

test('mergeGroundHeroGlyphIntoConfig overrides color and blendModes map', () => {
  const cfg = setGalleryConfig({
    theme: {
      graphics: {
        heroGlyph: {
          color: 'glyph',
          opacityMin: 0.15,
          opacityMax: 0.25,
          blendModes: {
            difference: { min: 0.2, max: 0.4 }
          }
        }
      }
    },
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: { display: '#2C2781', body: 'ink' },
        heroGlyph: {
          color: 'display',
          opacityMin: 0.5,
          opacityMax: 0.7,
          blendModes: {
            overlay: { min: 0.6, max: 0.8 }
          }
        }
      }
    }
  });

  const base = resolveHeroGlyphConfig(cfg);
  const merged = mergeGroundHeroGlyphIntoConfig(base, cfg.grounds.white);

  assert.equal(merged.color, 'display');
  assert.equal(merged.opacityMin, 0.5);
  assert.equal(merged.opacityMax, 0.7);
  assert.deepEqual(merged.blendModes, ['overlay']);
  assert.equal(merged.blendOpacity.overlay.min, 0.6);
  assert.equal(merged.blendModes.includes('difference'), false);
});

test('normalizeGround hoists heroGlyph from foreground for convenience', () => {
  const cfg = setGalleryConfig({
    grounds: {
      white: {
        surface: '#e7e7eb',
        foreground: {
          display: '#2C2781',
          heroGlyph: { color: 'accent' }
        }
      }
    }
  });

  const white = getGroundDefs(cfg).white;
  assert.equal(white.heroGlyph.color, 'accent');
  assert.equal(white.foreground.heroGlyph, undefined);
});
