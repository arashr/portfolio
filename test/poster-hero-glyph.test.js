import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  constrainHeroGlyphPlacement,
  heroEmptySpaceOffsets,
  resolveHeroGlyphOptions
} from '../lib/poster-hero-glyph.js';

test('resolveHeroGlyphOptions reads and clamps minimum visibility', () => {
  assert.equal(
    resolveHeroGlyphOptions({
      theme: { graphics: { heroGlyph: { layout: { minVisibleRatio: 0.8 } } } }
    }).minVisibleRatio,
    0.8
  );
  assert.equal(
    resolveHeroGlyphOptions({
      theme: { graphics: { heroGlyph: { layout: { minVisibleRatio: 2 } } } }
    }).minVisibleRatio,
    1
  );
});

test('constrainHeroGlyphPlacement keeps requested ink area visible', () => {
  const metrics = {
    width: 100,
    actualBoundingBoxLeft: 50,
    actualBoundingBoxRight: 50,
    actualBoundingBoxAscent: 50,
    actualBoundingBoxDescent: 50
  };
  const placement = constrainHeroGlyphPlacement(100, 100, -100, -100, metrics, 0.8);
  const visibleWidth = Math.min(100, placement.x + 50) - Math.max(0, placement.x - 50);
  const visibleHeight = Math.min(100, placement.y + 50) - Math.max(0, placement.y - 50);

  assert.ok(visibleWidth * visibleHeight >= 100 * 100 * 0.8 - 0.001);
});

test('heroEmptySpaceOffsets moves full-card center into a band', () => {
  const offsets = heroEmptySpaceOffsets(
    { clientWidth: 1000, clientHeight: 600 },
    { x: 600, y: 100, width: 340, height: 400 }
  );
  assert.equal(offsets.offsetX, 600 + 170 - 500);
  assert.equal(offsets.offsetY, 100 + 200 - 300);
});
