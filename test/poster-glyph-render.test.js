import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveForcedGlyphPlan } from '../lib/poster-glyph-render.js';

test('resolveForcedGlyphPlan forces pattern and blocks hero/none', () => {
  assert.deepEqual(resolveForcedGlyphPlan('/', ''), {
    forcePattern: true,
    allowHero: false,
    allowNone: false
  });
});

test('resolveForcedGlyphPlan keeps normal hero/none rules without a forced symbol', () => {
  assert.deepEqual(resolveForcedGlyphPlan('', ''), {
    forcePattern: false,
    allowHero: true,
    allowNone: true
  });
  assert.deepEqual(resolveForcedGlyphPlan('', 'pattern'), {
    forcePattern: false,
    allowHero: true,
    allowNone: false
  });
});
