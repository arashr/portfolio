import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  applyRisographEffects,
  resolveRisographConfig,
  RISOGRAPH_DEFAULTS
} from '../lib/risograph-effect.js';

test('resolveRisographConfig defaults', () => {
  const cfg = resolveRisographConfig({});
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.strength, RISOGRAPH_DEFAULTS.strength);
});

test('applyRisographEffects: riso on titles, grain on site layer', () => {
  const dom = new JSDOM(`<!doctype html><body>
    <div id="posters"><article class="post-card"><header class="post-header"><div class="post-title-bounds"><h1 class="poster__title">Hi</h1></div></header></article></div>
  </body>`);
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(dom.window, 'innerWidth', { value: 800, configurable: true });
  Object.defineProperty(dom.window, 'innerHeight', { value: 600, configurable: true });

  applyRisographEffects(document, {
    theme: { risograph: { enabled: true, strength: 0.5, grainAmount: 0.4, misregistration: 2 } }
  });

  const card = document.querySelector('.post-card');
  assert.ok(card.classList.contains('post-card--riso-title'));
  assert.match(card.style.getPropertyValue('--riso-title-filter'), /url\(#md-riso-title\)/);
  assert.equal(card.querySelector('.post-card__riso-title-grain'), null);
  assert.ok(document.getElementById('md-riso-site-grain'));
  assert.ok(document.documentElement.classList.contains('has-riso-site-grain'));

  applyRisographEffects(document, { theme: { risograph: { enabled: false } } });
  assert.ok(!card.classList.contains('post-card--riso-title'));
  assert.equal(document.getElementById('md-riso-site-grain'), null);

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.HTMLElement;
  delete globalThis.ResizeObserver;
});
