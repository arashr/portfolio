import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computePosterGlyphRegionFromLayout,
  regionKeyForSlug
} from '../lib/glyph-region.js';

const baseLayout = {
  cardWidth: 672,
  cardHeight: 900,
  contentLeft: 56,
  contentTop: 56,
  contentRight: 616,
  contentBottom: 844,
  contentWidth: 560,
  contentHeight: 788,
  headerTop: 56,
  headerBottom: 220,
  bodyTop: 220,
  bodyBottom: 844
};

const placement = {
  alignToCardEdge: true,
  emptySpaceMinPx: 84,
  emptySpaceMinRatio: 0.18,
  regionPreference: ['bottom', 'between', 'top', 'right', 'left'],
  regionInsetPx: 0,
  fallbackBandWidth: 88,
  sideBandWidthRatio: 2
};

test('slug picks a stable region from eligible keys', () => {
  const first = computePosterGlyphRegionFromLayout(baseLayout, placement, { slug: 'alpha' });
  const second = computePosterGlyphRegionFromLayout(baseLayout, placement, { slug: 'alpha' });
  assert.equal(first.regionKey, second.regionKey);
  assert.equal(first.slot, second.slot);
});

test('different slugs vary placement across eligible regions', () => {
  const keys = new Set();
  for (let i = 0; i < 24; i++) {
    const region = computePosterGlyphRegionFromLayout(baseLayout, placement, {
      slug: `poster-${i}`
    });
    keys.add(region.regionKey);
  }
  assert.ok(keys.size > 1);
});

test('regionKeyForSlug avoids immediate repeat when alternatives exist', () => {
  const keys = ['bottom', 'between', 'top', 'right', 'left'];
  let slug = '';
  for (let i = 0; i < 500; i++) {
    slug = `repeat-test-${i}`;
    if (regionKeyForSlug(slug, keys, null) === keys[0]) break;
  }
  assert.ok(slug);
  const first = regionKeyForSlug(slug, keys, null);
  const second = regionKeyForSlug(slug, keys, first);
  assert.notEqual(second, first);
});

test('poster sequence avoids consecutive region repeats', () => {
  let previousRegionKey = null;
  for (let i = 0; i < 20; i++) {
    const region = computePosterGlyphRegionFromLayout(baseLayout, placement, {
      slug: `case-poster-${i}`,
      previousRegionKey
    });
    if (previousRegionKey != null) {
      assert.notEqual(region.regionKey, previousRegionKey);
    }
    previousRegionKey = region.regionKey;
  }
});

test('large between gap can be slug-picked', () => {
  const layout = {
    ...baseLayout,
    headerBottom: 200,
    bodyTop: 380,
    bodyBottom: 844
  };
  const keys = new Set();
  for (let i = 0; i < 30; i++) {
    const region = computePosterGlyphRegionFromLayout(layout, placement, { slug: `between-${i}` });
    keys.add(region.regionKey);
  }
  assert.ok(keys.has('between'));
});

test('bottomBandHeightRatio doubles bottom padding band', () => {
  const single = computePosterGlyphRegionFromLayout(
    baseLayout,
    { ...placement, regionPreference: ['bottom'], bottomBandHeightRatio: 1 },
    { slug: 'bottom-only' }
  );
  const doubled = computePosterGlyphRegionFromLayout(
    baseLayout,
    { ...placement, regionPreference: ['bottom'], bottomBandHeightRatio: 2 },
    { slug: 'bottom-only' }
  );
  assert.equal(single.slot, 'bottom');
  assert.equal(doubled.height, single.height * 2);
  assert.equal(doubled.y, single.y - single.height);
});

test('side fallback when only side bands are eligible', () => {
  const region = computePosterGlyphRegionFromLayout(
    {
      ...baseLayout,
      headerTop: 0,
      headerBottom: 900,
      bodyTop: 900,
      bodyBottom: 900
    },
    {
      ...placement,
      regionPreference: ['bottom', 'between', 'top', 'left', 'right']
    },
    { slug: 'side-only' }
  );
  assert.equal(region.slot, 'side');
  assert.ok(region.x < baseLayout.contentLeft || region.x >= baseLayout.contentRight - 88);
});
