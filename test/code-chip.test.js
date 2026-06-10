import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCodeStylesheet,
  codeChipBgFromSurface,
  codeChipBgMixExpr,
  codeChipShadeMixExpr
} from '../lib/gallery-config.js';

const cfg = {
  theme: { code: {} },
  grounds: { butter: {}, tangerine: {}, white: {}, carmine: { foreground: { body: 'ground-carmine-fg' } } }
};

test('code chip CSS adjusts OKLCH lightness only', () => {
  assert.match(codeChipBgMixExpr('var(--surface)', 20), /oklch\(from var\(--surface\) clamp\(0, calc\(l \+ 0\.2\), 1\) c h\)/);
  assert.match(
    codeChipShadeMixExpr('var(--paper)', 10),
    /oklch\(from var\(--paper\) clamp\(0, calc\(l - 0\.1\), 1\) c h\)/
  );
});

test('buildCodeStylesheet emits lightness-only chip vars per ground', () => {
  const css = buildCodeStylesheet(cfg);
  assert.match(css, /\.ground-butter\{--on-ground-code-chip-bg:oklch\(from var\(--surface\)/);
  assert.match(css, /--code-chip-bg:oklch\(from var\(--paper\)/);
  assert.doesNotMatch(css, /--on-ground-code-chip-bg:color-mix/);
});

test('code chip lift keeps butter hue and chroma', () => {
  const chip = codeChipBgFromSurface('ground-butter', cfg, {}, 'butter');
  assert.notEqual(chip.toLowerCase(), '#fae44f');

  const surface = [250, 228, 79];
  const chipRgb = [
    parseInt(chip.slice(1, 3), 16),
    parseInt(chip.slice(3, 5), 16),
    parseInt(chip.slice(5, 7), 16)
  ];
  // Yellow ground: green channel should stay dominant over blue (not flip to green-gray).
  assert.ok(chipRgb[1] > chipRgb[2] + 40, `expected yellow chip, got ${chip}`);
  assert.ok(chipRgb[0] >= surface[0] - 5, `lift should lighten or hold red, got ${chip}`);
});

test('code chip shade keeps carmine hue', () => {
  const chip = codeChipBgFromSurface('ground-carmine', cfg, cfg.grounds.carmine, 'carmine');
  const chipRgb = [
    parseInt(chip.slice(1, 3), 16),
    parseInt(chip.slice(3, 5), 16),
    parseInt(chip.slice(5, 7), 16)
  ];
  assert.ok(chipRgb[0] > chipRgb[1] + 40, `expected red chip, got ${chip}`);
});
