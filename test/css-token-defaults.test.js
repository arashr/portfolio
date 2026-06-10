import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveGlyphPatternTokens } from '../lib/resolve-graphics-config.js';

test('resolveGlyphPatternTokens reads CSS defaults when config omits glyph', () => {
  const tokens = resolveGlyphPatternTokens({});
  assert.equal(tokens.color, '#c8102e');
  assert.equal(tokens.opacity, 0.07);
});
