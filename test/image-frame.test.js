import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImageTitle, renderMarkdownImage } from '../lib/image-frame.js';

test('parseImageTitle detects isometric flag', () => {
  assert.equal(parseImageTitle('isometric').isometric, true);
  assert.equal(parseImageTitle('iso').isometric, true);
  assert.equal(parseImageTitle('ISO').isometric, true);
  assert.equal(parseImageTitle('Settings menu').isometric, false);
});

test('parseImageTitle keeps non-flag title text', () => {
  const parsed = parseImageTitle('isometric, Settings dropdown');
  assert.equal(parsed.isometric, true);
  assert.equal(parsed.title, 'Settings dropdown');
});

test('renderMarkdownImage wraps isometric images in figure', () => {
  const html = renderMarkdownImage({
    src: 'menu.png',
    alt: 'Menu',
    title: 'isometric'
  });
  assert.match(html, /class="prose-img-iso"/);
  assert.match(html, /class="prose-img-iso__frame"/);
  assert.doesNotMatch(html, /title=/);
  assert.doesNotMatch(html, /prose-img-iso__caption/);
});

test('renderMarkdownImage shows iso caption from title text', () => {
  const html = renderMarkdownImage({
    src: 'menu.png',
    alt: 'Menu',
    title: 'iso Settings dropdown'
  });
  assert.match(html, /class="prose-img-iso__caption mono-label">Settings dropdown<\/span>/);
  assert.doesNotMatch(html, /title=/);
});

test('renderMarkdownImage leaves plain images unwrapped', () => {
  const html = renderMarkdownImage({ src: 'x.png', alt: 'X' });
  assert.match(html, /^<img /);
  assert.doesNotMatch(html, /prose-img-iso/);
  assert.doesNotMatch(html, /prose-img-iso__caption/);
});

test('renderMarkdownImage does not show caption on non-iso images', () => {
  const html = renderMarkdownImage({
    src: 'x.png',
    alt: 'X',
    title: 'Visible only as tooltip'
  });
  assert.doesNotMatch(html, /prose-img-iso__caption/);
  assert.match(html, /title="Visible only as tooltip"/);
});

test('renderMarkdownImage emits width and height when provided', () => {
  const html = renderMarkdownImage({
    src: 'x.png',
    alt: 'X',
    width: 1200,
    height: 800
  });
  assert.match(html, /width="1200" height="800"/);
});

test('renderMarkdownImage wraps responsive WebP sources when variants provided', () => {
  const html = renderMarkdownImage({
    src: '/content/src/hero.png',
    alt: 'Hero',
    width: 1920,
    height: 1080,
    variants: [
      { url: '/content/src/hero.960w.webp', w: 960 },
      { url: '/content/src/hero.webp', w: 1920 }
    ]
  });
  assert.match(html, /^<picture>/);
  assert.match(html, /type="image\/webp"/);
  assert.match(html, /hero\.960w\.webp 960w/);
  assert.match(html, /src="\/content\/src\/hero\.png"/);
});
