import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  applyGalleryConfigToDocument,
  resolveLandingHeaderConfig,
  resolveLandingNameTitleScale,
  setGalleryConfig
} from '../lib/gallery-config.js';
import { mergeLandingHeaderGlyphIntoPatternConfig } from '../lib/resolve-ground-graphics.js';
import { resolveTypePatternConfig } from '../lib/resolve-graphics-config.js';
import { renderLandingMosaic } from '../lib/render-landing-mosaic.js';

test('resolveLandingHeaderConfig merges landing.header title scale', () => {
  const cfg = setGalleryConfig({
    landing: {
      header: {
        ground: 'carmine',
        titleScale: { minPx: 120, maxPx: 220 },
        layout: { titleColumnSpan: 8 }
      }
    }
  });

  const header = resolveLandingHeaderConfig(cfg);
  const scale = resolveLandingNameTitleScale(cfg);

  assert.equal(header.ground, 'carmine');
  assert.equal(header.layout.titleColumnSpan, 8);
  assert.equal(scale.minPx, 120);
  assert.equal(scale.maxPx, 220);
});

test('mergeLandingHeaderGlyphIntoPatternConfig applies pool and disables none roll', () => {
  const cfg = setGalleryConfig({});
  const base = resolveTypePatternConfig(cfg);
  const merged = mergeLandingHeaderGlyphIntoPatternConfig(
    base,
    {
      symbolPool: '<>',
      symbolProbability: 1,
      patternTypes: ['fill'],
      geometry: { gridStaggerProbability: 1 },
      placement: { regionPreference: ['top'] }
    },
    cfg
  );

  assert.equal(merged.symbolPool, '<>');
  assert.equal(merged.symbolProbability, 1);
  assert.deepEqual(merged.patternTypes, ['fill']);
  assert.deepEqual(merged.regionPreference, ['top']);
  assert.equal(merged.noneProbability, 0);
  assert.equal(merged.gridStaggerProbability, 1);
});

test('renderLandingMosaic reads landing.header ground and face', () => {
  setGalleryConfig({
    landing: {
      header: {
        ground: 'mint',
        titleFace: 'anton',
        glyph: { symbolPool: '<>' }
      }
    }
  });

  const html = renderLandingMosaic({
    site: { title: 'Arash Ranjbaran', tagline: 'Product Design · Berlin' },
    items: [],
    aside: { sections: [] }
  });

  assert.match(html, /ground-mint.*landing-name-card/);
  assert.match(html, /title-face-anton/);
  assert.match(html, /data-lab-glyph="pattern"/);
});

test('buildLandingHeaderStylesheet injects column vars', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

  setGalleryConfig({
    landing: {
      header: {
        layout: { titleColumnSpan: 10, copyColumnSpan: 4, minHeight: '70vh' },
        glyph: { color: 'red' }
      }
    }
  });

  applyGalleryConfigToDocument();
  const style = document.getElementById('gallery-config-landing-header')?.textContent || '';
  assert.match(style, /--landing-header-title-columns: 1 \/ span 10/);
  assert.match(style, /--landing-header-min-height: 70vh/);
  assert.match(style, /--glyph-pattern-color:/);
});
