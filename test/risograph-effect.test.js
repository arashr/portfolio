import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  applyRisographEffects,
  resolveRisographConfig,
  RISOGRAPH_DEFAULTS,
  RISOGRAPH_TARGET_DEFAULTS
} from '../lib/risograph-effect.js';

test('resolveRisographConfig defaults include targets', () => {
  const cfg = resolveRisographConfig({});
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.strength, RISOGRAPH_DEFAULTS.strength);
  assert.equal(cfg.targets.landingName, RISOGRAPH_TARGET_DEFAULTS.landingName);
  assert.equal(cfg.targets.posterTitle, RISOGRAPH_TARGET_DEFAULTS.posterTitle);
  assert.equal(cfg.targets.heading, RISOGRAPH_TARGET_DEFAULTS.heading);
});

test('resolveRisographConfig merges target intensities', () => {
  const cfg = resolveRisographConfig({
    enabled: true,
    targets: { heading: 0.2, isoShadow: 0.5, landingName: 1.5 }
  });
  assert.equal(cfg.targets.heading, 0.2);
  assert.equal(cfg.targets.isoShadow, 0.5);
  assert.equal(cfg.targets.landingName, 1.5);
  assert.equal(cfg.targets.posterTitle, RISOGRAPH_TARGET_DEFAULTS.posterTitle);
});

test('resolveRisographConfig allows target intensity above 1', () => {
  const cfg = resolveRisographConfig({
    targets: { isoShadow: 3, imageCaption: 0.5 }
  });
  assert.equal(cfg.targets.isoShadow, 3);
  assert.equal(cfg.targets.imageCaption, 0.5);
});

test('applyRisographEffects sets per-target filters and site grain', () => {
  const dom = new JSDOM(`<!doctype html><body>
    <div id="landing"><article class="post-card landing-name-card"><header class="post-header"><div class="post-title-bounds"><h1 class="poster__title">Name</h1></div></header></article></div>
    <div id="posters"><article class="post-card"><header class="post-header"><div class="post-title-bounds"><h1 class="poster__title">Hi</h1></div></header>
      <div class="prose post-body"><h2>Section</h2></div></article></div>
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
    theme: {
      risograph: {
        enabled: true,
        strength: 0.5,
        grainAmount: 0.4,
        misregistration: 2,
        targets: {
          landingName: 0.3,
          posterTitle: 1,
          heading: 0.5,
          imageBorder: 0.2,
          imageCaption: 0.9,
          tableBorder: 0,
          isoShadow: 3
        }
      }
    }
  });

  const card = document.querySelector('#posters .post-card');
  const nameCard = document.querySelector('.landing-name-card');
  assert.ok(card.classList.contains('post-card--riso'));
  assert.ok(nameCard.classList.contains('post-card--riso'));
  assert.ok(document.documentElement.classList.contains('has-riso'));
  assert.match(card.style.getPropertyValue('--riso-filter-posterTitle'), /url\(#md-riso-fringe-/);
  assert.match(nameCard.style.getPropertyValue('--riso-filter-landingName'), /url\(#md-riso-fringe-/);
  assert.match(
    document.documentElement.style.getPropertyValue('--riso-filter-imageCaption'),
    /url\(#md-riso-fringe-/
  );
  assert.match(
    document.documentElement.style.getPropertyValue('--riso-filter-imageBorder'),
    /url\(#md-riso-fringe-/
  );
  assert.ok(document.getElementById('md-riso-site-grain'));

  applyRisographEffects(document, { theme: { risograph: { enabled: false } } });
  assert.ok(!card.classList.contains('post-card--riso'));
  assert.ok(!document.documentElement.classList.contains('has-riso'));
  assert.equal(document.getElementById('md-riso-site-grain'), null);

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.HTMLElement;
  delete globalThis.ResizeObserver;
});
