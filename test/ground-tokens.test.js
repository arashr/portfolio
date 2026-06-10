import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroundStylesheet,
  getGroundDefs,
  resolveColor,
  setGalleryConfig
} from '../lib/gallery-config.js';
import { GROUND_COLOR_DEFAULTS, groundForegroundRefs } from '../lib/ground-tokens.js';

test('resolveColor resolves ground token slugs', () => {
  setGalleryConfig({});
  assert.equal(resolveColor('ground-pink'), GROUND_COLOR_DEFAULTS['ground-pink']);
  assert.equal(resolveColor('ground-pink-display'), GROUND_COLOR_DEFAULTS['ground-pink-display']);
  assert.equal(resolveColor('ground-mint-glyph'), GROUND_COLOR_DEFAULTS['ground-mint-glyph']);
});

test('normalizeGround infers surface and foreground token refs', () => {
  const cfg = setGalleryConfig({ grounds: { mint: {} } });
  const mint = getGroundDefs(cfg).mint;
  assert.equal(mint.surface, 'ground-mint');
  assert.equal(mint.foreground.display, 'ground-mint-display');
  assert.equal(mint.foreground.muted, 'ground-fg-muted');
});

test('groundForegroundRefs covers all default grounds', () => {
  const cfg = setGalleryConfig({});
  for (const name of Object.keys(cfg.grounds)) {
    assert.ok(groundForegroundRefs(name).display, `missing display ref for ${name}`);
  }
});

test('buildGroundStylesheet injects reader-only mint glyph tokens for empty mint', () => {
  const cfg = setGalleryConfig({
    grounds: {
      pink: {},
      butter: {},
      mint: {}
    }
  });

  const css = buildGroundStylesheet(cfg);
  assert.match(css, /#main-reader \.post-card\.ground-mint\{--on-ground-glyph-pattern-color:#c8102e/i);
  for (const name of ['pink', 'butter']) {
    assert.equal(
      css.split('\n').some((line) => line.startsWith(`.ground-${name}{--on-ground-glyph-pattern`)),
      false
    );
  }
});
