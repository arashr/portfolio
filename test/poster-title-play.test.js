import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTitlePlayMaxPx } from '../lib/fit-poster-title.js';
import { resolveTitlePlay } from '../lib/gallery-config.js';

test('title play boosts short titles in wide columns', () => {
  const shortWide = resolveTitlePlayMaxPx(100, {
    enabled: true,
    maxScale: 1.35,
    shortTitleChars: 22,
    shortTitleBoost: 1.15,
    titleChars: 12,
    columnRatio: 10 / 12
  });
  const longNarrow = resolveTitlePlayMaxPx(100, {
    enabled: true,
    maxScale: 1.35,
    shortTitleChars: 22,
    shortTitleBoost: 1.15,
    titleChars: 60,
    columnRatio: 5 / 12
  });
  assert.ok(shortWide > 100);
  assert.ok(shortWide > longNarrow);
  assert.equal(resolveTitlePlayMaxPx(100, { enabled: false }), 100);
});

test('resolveTitlePlay clamps config values', () => {
  const cfg = resolveTitlePlay({
    theme: {
      titlePlay: {
        enabled: true,
        maxScale: 9,
        shortTitleBoost: 0.5
      }
    }
  });
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.maxScale, 2);
  assert.equal(cfg.shortTitleBoost, 1);
});
