import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveImageIsometricOptions,
  imageIsometricCssVars,
  IMAGE_ISO_DEFAULTS,
  convexHull,
  isoExtrusionHull,
  isoExtrusionSlabPath,
  hullToSvgPath,
  roundedRectContour,
  softIsoConcentricRadii,
  scaleSoftIsoRadius,
  extractSvgNativeCornerRadius
} from '../lib/image-iso-config.js';

test('resolveImageIsometricOptions uses 2D skew defaults', () => {
  const iso = resolveImageIsometricOptions({});
  assert.equal(iso.rotate, IMAGE_ISO_DEFAULTS.rotate);
  assert.equal(iso.skewX, IMAGE_ISO_DEFAULTS.skewX);
  assert.equal(iso.depthX, IMAGE_ISO_DEFAULTS.depthX);
  assert.equal(iso.color, IMAGE_ISO_DEFAULTS.color);
  assert.equal(iso.radius, IMAGE_ISO_DEFAULTS.radius);
  assert.equal(iso.borderWidth, 1);
});

test('resolveImageIsometricOptions reads the skew config surface', () => {
  const iso = resolveImageIsometricOptions({
    theme: {
      graphics: {
        imageIsometric: {
          rotate: 0,
          skewX: -4,
          skewY: 2,
          depthX: 8,
          depthY: 8,
          borderWidth: 1,
          color: '#000000',
          face: '#ffffff',
          radius: 12
        }
      }
    }
  });
  assert.equal(iso.rotate, 0);
  assert.equal(iso.skewX, -4);
  assert.equal(iso.depthX, 8);
  assert.equal(iso.color, '#000000');
  assert.equal(iso.radius, 12);
  assert.equal(iso.borderWidth, 1);
});

test('resolveImageIsometricOptions accepts legacy 3D keys as weak fallbacks', () => {
  const iso = resolveImageIsometricOptions({
    theme: {
      graphics: {
        imageIsometric: {
          rotateZ: 3,
          solidShadowX: 12,
          solidShadowY: 9,
          stroke: '#111111'
        }
      }
    }
  });
  assert.equal(iso.rotate, 3);
  assert.equal(iso.depthX, 12);
  assert.equal(iso.depthY, 9);
  assert.equal(iso.color, '#111111');
});

test('imageIsometricCssVars exposes base and active facing tokens', () => {
  const vars = imageIsometricCssVars(
    resolveImageIsometricOptions({
      theme: {
        graphics: {
          imageIsometric: {
            rotate: 0,
            skewX: -4,
            skewY: 2,
            depthX: 8,
            depthY: 8,
            borderWidth: 1,
            color: '#000000',
            face: '#ffffff',
            radius: 12
          }
        }
      }
    })
  );
  assert.equal(vars['--config-iso-skew-x-base'], '-4deg');
  assert.equal(vars['--config-iso-skew-x'], '-4deg');
  assert.equal(vars['--config-iso-depth-x-base'], '8px');
  assert.equal(vars['--config-iso-depth-inset'], '8px');
  assert.equal(vars['--config-iso-radius'], '12px');
  assert.equal(vars['--config-iso-stroke'], '#000000');
});

test('convexHull and slab path are stable for positive depth', () => {
  const hull = isoExtrusionHull(100, 60, 8, 8, 0, 0);
  assert.ok(hull.length >= 4);
  const path = isoExtrusionSlabPath(100, 60, 8, 8, { radius: 0, tuck: 1 });
  assert.match(path, /^M/);
  assert.match(path, /Z/);
});

test('isoExtrusionSlabPath flips with negative depth', () => {
  const right = isoExtrusionSlabPath(80, 40, 10, 10, { tuck: 1 });
  const left = isoExtrusionSlabPath(80, 40, -10, 10, { tuck: 1 });
  assert.notEqual(right, left);
  assert.match(left, /^M/);
});

test('roundedRectContour and soft radii helpers', () => {
  assert.equal(roundedRectContour(100, 50, 0).length, 4);
  assert.ok(roundedRectContour(100, 50, 8).length > 4);
  assert.deepEqual(softIsoConcentricRadii(8, 1), { outer: 9, inner: 8 });
  assert.equal(scaleSoftIsoRadius(10, 100, 50), 5);
});

test('extractSvgNativeCornerRadius reads full-bleed rect rx', () => {
  const svg = `<svg width="100" height="50" viewBox="0 0 100 50"><rect width="100" height="50" rx="12"/></svg>`;
  assert.equal(extractSvgNativeCornerRadius(svg), 12);
});

test('hullToSvgPath requires at least three points', () => {
  assert.equal(hullToSvgPath(convexHull([{ x: 0, y: 0 }, { x: 1, y: 0 }])), '');
  assert.match(hullToSvgPath(convexHull([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 2 }])), /^M/);
});
