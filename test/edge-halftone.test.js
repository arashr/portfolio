import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  edgeHalftoneDotRadius,
  edgeHalftoneLuminanceAtY,
  isHomeView,
  landingFooterOffset,
  resolveEdgeHalftoneConfig,
  resolveEdgeHalftoneFillColor,
  resolveEdgeHalftoneLayout
} from '../lib/edge-halftone.js';

test('resolveEdgeHalftoneConfig merges defaults and legacy dissolve keys', () => {
  const cfg = resolveEdgeHalftoneConfig({
    theme: { dissolveEdge: { enabled: true, blockSizePx: 8, rowCount: 4 } }
  });
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.dotPx, 8);
});

test('resolveEdgeHalftoneLayout auto pushPx when unset', () => {
  const opts = resolveEdgeHalftoneConfig({ theme: { edgeHalftone: { heightPx: 96, dotPx: 6 } } });
  const layout = resolveEdgeHalftoneLayout(opts);
  assert.ok(layout.pushPx >= 36);
  assert.equal(layout.totalH, 96 + layout.pushPx);
});

test('resolveEdgeHalftoneConfig defaults showOnHome to false', () => {
  assert.equal(resolveEdgeHalftoneConfig({}).showOnHome, false);
});

test('isHomeView is true when landing is visible', () => {
  const root = {
    getElementById(id) {
      if (id !== 'landing') return null;
      return { classList: { contains: () => false } };
    }
  };
  assert.equal(isHomeView(root), true);
});

test('edgeHalftoneDotRadius is largest at the canvas bottom', () => {
  const opts = resolveEdgeHalftoneConfig({});
  const { totalH, pushPx } = resolveEdgeHalftoneLayout(opts);
  const bottom = edgeHalftoneDotRadius(totalH - 1, totalH, opts);
  const topVisible = edgeHalftoneDotRadius(pushPx, totalH, opts);
  assert.equal(bottom, opts.dotPx * opts.mergeDotScale);
  assert.ok(topVisible < bottom);
});

test('larger pushPx makes the visible top row denser', () => {
  const base = resolveEdgeHalftoneConfig({
    theme: { edgeHalftone: { heightPx: 96, pushPx: 0, dotPx: 6 } }
  });
  const pushed = resolveEdgeHalftoneConfig({
    theme: { edgeHalftone: { heightPx: 96, pushPx: 48, dotPx: 6 } }
  });
  const noPushTop = edgeHalftoneDotRadius(0, resolveEdgeHalftoneLayout(base).totalH, base);
  const pushTop = edgeHalftoneDotRadius(48, resolveEdgeHalftoneLayout(pushed).totalH, pushed);
  assert.ok(pushTop > noPushTop);
});

test('edgeHalftoneLuminanceAtY grows toward the top of the band', () => {
  const height = 100;
  assert.ok(edgeHalftoneLuminanceAtY(0, height) > edgeHalftoneLuminanceAtY(50, height));
  assert.ok(edgeHalftoneLuminanceAtY(50, height) > edgeHalftoneLuminanceAtY(99, height));
});

test('resolveEdgeHalftoneFillColor uses page background for paper token', () => {
  const cfg = { theme: { colors: { paper: '#eff1f3' } } };
  assert.equal(resolveEdgeHalftoneFillColor('paper', cfg), '#eff1f3');
  assert.equal(resolveEdgeHalftoneFillColor('#c8102e', cfg), '#c8102e');
});

test('landingFooterOffset is zero when landing is hidden', () => {
  const root = {
    getElementById(id) {
      if (id !== 'landing') return null;
      return { classList: { contains: () => true }, querySelector: () => null };
    }
  };
  assert.equal(landingFooterOffset(root), 0);
});
