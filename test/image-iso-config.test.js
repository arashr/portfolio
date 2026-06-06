import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveImageIsometricOptions,
  imageIsometricCssVars,
  IMAGE_ISO_DEFAULTS
} from '../lib/image-iso-config.js';

test('resolveImageIsometricOptions uses defaults', () => {
  const iso = resolveImageIsometricOptions({});
  assert.equal(iso.rotateY, IMAGE_ISO_DEFAULTS.rotateY);
  assert.equal(iso.stroke, '#000000');
});

test('resolveImageIsometricOptions merges config', () => {
  const iso = resolveImageIsometricOptions({
    theme: {
      graphics: {
        imageIsometric: {
          rotateY: -20,
          stroke: '#000000'
        }
      }
    }
  });
  assert.equal(iso.rotateY, -20);
});

test('imageIsometricCssVars exposes transform and black stroke tokens', () => {
  const vars = imageIsometricCssVars(resolveImageIsometricOptions({}));
  assert.equal(vars['--config-iso-rotate-y'], '-16deg');
  assert.equal(vars['--config-iso-stroke'], '#000000');
  assert.match(vars['--config-iso-soft-shadow-color'], /^rgba\(0, 0, 0,/);
});

test('resolveImageIsometricOptions disables perspective with false or none', () => {
  assert.equal(
    resolveImageIsometricOptions({ theme: { graphics: { imageIsometric: { perspective: false } } } })
      .perspective,
    'none'
  );
  assert.equal(
    resolveImageIsometricOptions({ theme: { graphics: { imageIsometric: { perspective: 'none' } } } })
      .perspective,
    'none'
  );
});
