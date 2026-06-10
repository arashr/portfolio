import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { resolveLightboxCaption } from '../lib/image-lightbox.js';

/** @param {string} html */
function imgFrom(html) {
  const dom = new JSDOM(`<div>${html}</div>`);
  const img = dom.window.document.querySelector('img');
  assert.ok(img);
  return /** @type {HTMLImageElement} */ (img);
}

test('resolveLightboxCaption prefers iso caption over alt', () => {
  const img = imgFrom(`
    <div class="prose-img-iso__frame">
      <span class="prose-img-iso__caption mono-label">Storybook</span>
      <img src="a.png" alt="Storybook UI screenshot">
    </div>
  `);
  assert.equal(resolveLightboxCaption(img), 'Storybook');
});

test('resolveLightboxCaption uses title attribute when present', () => {
  const img = imgFrom('<img src="a.png" alt="Alt text" title="Settings dropdown">');
  assert.equal(resolveLightboxCaption(img), 'Settings dropdown');
});

test('resolveLightboxCaption falls back to alt', () => {
  const img = imgFrom('<img src="a.png" alt="Alt text">');
  assert.equal(resolveLightboxCaption(img), 'Alt text');
});
