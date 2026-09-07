import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyParallaxEasing,
  bleedExitDistance,
  layerParallaxY,
  resolveScrollParallaxConfig,
  sectionBoundaryProgress,
  visibleMidpoint,
  SCROLL_PARALLAX_DEFAULTS
} from '../lib/scroll-parallax.js';

test('applyParallaxEasing easeOut runs ahead of linear mid-scroll', () => {
  assert.ok(applyParallaxEasing(0.5, 'easeOut') > 0.5);
  assert.ok(applyParallaxEasing(0.25, 'easeIn') < 0.25);
  assert.equal(applyParallaxEasing(0.5, 'easeInOut'), 0.5);
  assert.equal(applyParallaxEasing(0.5, 'linear'), 0.5);
});

test('sectionBoundaryProgress maps parent→child scroll span', () => {
  assert.equal(sectionBoundaryProgress(100, 100, 300), 0);
  assert.equal(sectionBoundaryProgress(200, 100, 300), 0.5);
  assert.equal(sectionBoundaryProgress(300, 100, 300), 1);
  assert.equal(sectionBoundaryProgress(50, 100, 300), 0);
  assert.equal(sectionBoundaryProgress(400, 100, 300), 1);
});

test('visibleMidpoint is null off-screen and tracks the clipped band', () => {
  assert.equal(visibleMidpoint({ top: -200, bottom: -20 }, 1000), null);
  assert.equal(visibleMidpoint({ top: 1200, bottom: 1400 }, 1000), null);
  assert.equal(visibleMidpoint({ top: -100, bottom: 1100 }, 1000), 500);
  assert.equal(visibleMidpoint({ top: 800, bottom: 1200 }, 1000), 900);
});

test('layerParallaxY is 0 at viewport center and continuous at the clamp', () => {
  assert.equal(layerParallaxY(500, 1000, 0.1, 'linear'), 0);
  assert.ok(layerParallaxY(750, 1000, 0.1, 'linear') > 0);
  assert.ok(layerParallaxY(250, 1000, 0.1, 'linear') < 0);
  assert.equal(layerParallaxY(-5000, 1000, 0.1, 'linear'), layerParallaxY(-500, 1000, 0.1, 'linear'));
  assert.equal(layerParallaxY(8000, 1000, 0.1, 'linear'), layerParallaxY(1500, 1000, 0.1, 'linear'));
});

test('bleedExitDistance respects minimum exit height and viewport cap', () => {
  const mid = bleedExitDistance(0.5, 1000, 0.4, 'linear', 80, 0.5);
  // ratio*vh=400, maxVh*vh=500 → travel=max(400,80)=400; eased mid=200
  assert.equal(mid, 200);
  const capped = bleedExitDistance(1, 1000, 0.5, 'linear', 0, 0.1);
  assert.equal(capped, 100);
  const late = bleedExitDistance(1, 100, 0.05, 'linear', 80, 0.14);
  assert.equal(late, 80);
});

test('resolveScrollParallaxConfig clamps ratios and keeps defaults', () => {
  const cfg = resolveScrollParallaxConfig({
    titleRatio: 2,
    contentRatio: -1,
    glyphRatio: 0.3
  });
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.titleRatio, 0.6);
  assert.equal(cfg.contentRatio, 0);
  assert.equal(cfg.glyphRatio, 0.3);
  assert.equal(cfg.bleedRatio, SCROLL_PARALLAX_DEFAULTS.bleedRatio);
});
