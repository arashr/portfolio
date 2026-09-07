import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expandOverscanForInk,
  resolveGlyphCanvasOverscan
} from '../lib/glyph-canvas-overscan.js';

test('resolveGlyphCanvasOverscan grows with sizeRatio and glyph parallax', () => {
  const base = resolveGlyphCanvasOverscan(1000, 800, {
    sizeRatio: 1,
    offsetXRatioMax: 0,
    glyphRatio: 0.1,
    viewportPx: 800
  });
  const wide = resolveGlyphCanvasOverscan(1000, 800, {
    sizeRatio: 1.2,
    offsetXRatioMax: 0.35,
    glyphRatio: 0.2,
    viewportPx: 800
  });
  assert.ok(wide.padX > base.padX);
  assert.ok(wide.padY >= base.padY);
  assert.ok(wide.padY >= Math.ceil(800 * 0.2 * 1.5));
});

test('expandOverscanForInk covers ink that sticks past the design box', () => {
  const grown = expandOverscanForInk(
    100,
    100,
    { padX: 10, padY: 10 },
    { left: -40, right: 130, top: -5, bottom: 90 }
  );
  assert.equal(grown.padX, 40);
  assert.equal(grown.padY, 10);
});
