import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import {
  containRect,
  portfolioExpandBounds,
  resolveExpandCaption,
  sourceLayoutBox
} from '../lib/portfolio-image-expand.js';

describe('portfolio-image-expand', () => {
  it('containRect preserves aspect and fits inside the box', () => {
    const box = { x: 48, y: 48, w: 1200, h: 600 };
    const rect = containRect(1600, 900, box);
    assert.ok(Math.abs(rect.w / rect.h - 1600 / 900) < 0.001);
    assert.ok(rect.w <= box.w + 0.001);
    assert.ok(rect.h <= box.h + 0.001);
    assert.ok(rect.x >= box.x - 0.001);
    assert.ok(rect.y >= box.y - 0.001);
  });

  it('containRect letterboxes a tall image', () => {
    const box = { x: 0, y: 0, w: 1000, h: 400 };
    const rect = containRect(400, 800, box);
    assert.equal(rect.h, 400);
    assert.ok(Math.abs(rect.w - 200) < 0.001);
    assert.ok(Math.abs(rect.x - 400) < 0.001);
  });

  it('portfolioExpandBounds returns a positive field without DOM vars', () => {
    const zone = portfolioExpandBounds();
    assert.ok(zone.w > 0);
    assert.ok(zone.h > 0);
  });

  it('sourceLayoutBox centers layout size on the AABB', () => {
    const el = {
      getBoundingClientRect: () => ({ left: 100, top: 50, width: 200, height: 100 }),
      offsetWidth: 200,
      offsetHeight: 100
    };
    const box = sourceLayoutBox(/** @type {any} */ (el));
    assert.equal(box.width, 200);
    assert.equal(box.height, 100);
    assert.equal(box.left, 100);
    assert.equal(box.top, 50);
  });
});

describe('resolveExpandCaption', () => {
  /** @param {string} html */
  function imgFrom(html) {
    const dom = new JSDOM(`<div>${html}</div>`);
    const img = dom.window.document.querySelector('img');
    assert.ok(img);
    return /** @type {HTMLImageElement} */ (img);
  }

  it('prefers iso caption over alt', () => {
    const img = imgFrom(`
      <div class="prose-img-iso__frame">
        <span class="prose-img-iso__caption mono-label">Storybook</span>
        <img src="a.png" alt="Storybook UI screenshot">
      </div>
    `);
    assert.equal(resolveExpandCaption(img), 'Storybook');
  });

  it('uses title attribute when present', () => {
    const img = imgFrom('<img src="a.png" alt="Alt text" title="Settings dropdown">');
    assert.equal(resolveExpandCaption(img), 'Settings dropdown');
  });

  it('falls back to alt', () => {
    const img = imgFrom('<img src="a.png" alt="Alt text">');
    assert.equal(resolveExpandCaption(img), 'Alt text');
  });
});
