import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import { parseImageTitle, renderMarkdownImage } from '../lib/image-frame.js';

describe('parseImageTitle', () => {
  it('defaults to no layout flags', () => {
    assert.deepEqual(parseImageTitle(''), {
      isometric: false,
      half: false,
      isoGrid: false,
      title: ''
    });
  });

  it('detects iso and strips it from the caption title', () => {
    assert.deepEqual(parseImageTitle('iso Exploring cards'), {
      isometric: true,
      half: false,
      isoGrid: false,
      title: 'Exploring cards'
    });
  });

  it('detects iso-grid', () => {
    assert.deepEqual(parseImageTitle('iso-grid Cards'), {
      isometric: true,
      half: false,
      isoGrid: true,
      title: 'Cards'
    });
    assert.equal(parseImageTitle('isogrid').isoGrid, true);
  });

  it('detects half aliases', () => {
    for (const flag of ['half', 'half-right', 'bleed-right']) {
      assert.deepEqual(parseImageTitle(flag), {
        isometric: false,
        half: true,
        isoGrid: false,
        title: ''
      });
    }
  });

  it('keeps the first layout flag when both are present', () => {
    assert.equal(parseImageTitle('iso half').isometric, true);
    assert.equal(parseImageTitle('iso half').half, false);
    assert.equal(parseImageTitle('half iso').half, true);
    assert.equal(parseImageTitle('half iso').isometric, false);
    assert.equal(parseImageTitle('iso-grid half').isoGrid, true);
    assert.equal(parseImageTitle('iso-grid half').half, false);
  });
});

describe('renderMarkdownImage', () => {
  it('wraps half images in prose-img-half', () => {
    const html = renderMarkdownImage({
      src: 'a.png',
      alt: 'A',
      title: 'half'
    });
    assert.match(html, /prose-img-half/);
  });

  it('wraps iso images in a table-style frame', () => {
    const html = renderMarkdownImage({
      src: 'a.png',
      alt: 'A',
      title: 'iso Caption'
    });
    assert.match(html, /prose-img-iso/);
    assert.match(html, /prose-img-iso__frame/);
    assert.match(html, /prose-img-iso__caption/);
    assert.match(html, /Caption/);
    assert.doesNotMatch(html, /extrusion/);
    assert.doesNotMatch(html, /prose-img-iso--grid/);
  });

  it('marks iso-grid figures for collage layout', () => {
    const html = renderMarkdownImage({
      src: 'a.png',
      alt: 'A',
      title: 'iso-grid'
    });
    assert.match(html, /prose-img-iso prose-img-iso--grid/);
    assert.doesNotMatch(html, /extrusion/);
  });

  it('leaves plain images unwrapped', () => {
    const html = renderMarkdownImage({ src: 'x.png', alt: 'X' });
    assert.match(html, /^<img /);
    assert.doesNotMatch(html, /prose-img-iso/);
  });

  it('does not show caption on non-iso images', () => {
    const html = renderMarkdownImage({
      src: 'x.png',
      alt: 'X',
      title: 'Visible only as tooltip'
    });
    assert.doesNotMatch(html, /prose-img-iso__caption/);
    assert.match(html, /title="Visible only as tooltip"/);
  });

  it('emits width and height when provided', () => {
    const html = renderMarkdownImage({
      src: 'x.png',
      alt: 'X',
      width: 1200,
      height: 800
    });
    assert.match(html, /width="1200" height="800"/);
  });

  it('wraps responsive WebP sources when variants provided', () => {
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
});

test('parseImageTitle accepts isometric alias', () => {
  assert.equal(parseImageTitle('isometric').isometric, true);
  assert.equal(parseImageTitle('ISO').isometric, true);
});
