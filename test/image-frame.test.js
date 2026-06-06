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
});

test('renderMarkdownImage leaves plain images unwrapped', () => {
  const html = renderMarkdownImage({ src: 'x.png', alt: 'X' });
  assert.match(html, /^<img /);
  assert.doesNotMatch(html, /prose-img-iso/);
});
