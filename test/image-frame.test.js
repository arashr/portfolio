import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import {
  parseImageTitle,
  renderMarkdownImage,
  isSoftIsoSource,
  isoSkewOverrideStyle
} from '../lib/image-frame.js';

describe('parseImageTitle', () => {
  it('defaults to no layout flags', () => {
    assert.deepEqual(parseImageTitle(''), {
      isometric: false,
      half: false,
      isoGrid: false,
      skewX: null,
      skewY: null,
      radius: null,
      title: ''
    });
  });

  it('detects iso and strips it from the caption title', () => {
    assert.deepEqual(parseImageTitle('iso Exploring cards'), {
      isometric: true,
      half: false,
      isoGrid: false,
      skewX: null,
      skewY: null,
      radius: null,
      title: 'Exploring cards'
    });
  });

  it('parses iso,skewX,skewY overrides before the caption', () => {
    assert.deepEqual(parseImageTitle('iso,-10,7 Exploring cards'), {
      isometric: true,
      half: false,
      isoGrid: false,
      skewX: -10,
      skewY: 7,
      radius: null,
      title: 'Exploring cards'
    });
    assert.deepEqual(parseImageTitle('iso -10 7'), {
      isometric: true,
      half: false,
      isoGrid: false,
      skewX: -10,
      skewY: 7,
      radius: null,
      title: ''
    });
  });

  it('allows skewX alone', () => {
    assert.deepEqual(parseImageTitle('iso,-4 Caption'), {
      isometric: true,
      half: false,
      isoGrid: false,
      skewX: -4,
      skewY: null,
      radius: null,
      title: 'Caption'
    });
  });

  it('parses per-image soft radius tokens', () => {
    assert.deepEqual(parseImageTitle('iso,r4'), {
      isometric: true,
      half: false,
      isoGrid: false,
      skewX: null,
      skewY: null,
      radius: 4,
      title: ''
    });
    assert.deepEqual(parseImageTitle('iso,-10,7,radius:12 Soft'), {
      isometric: true,
      half: false,
      isoGrid: false,
      skewX: -10,
      skewY: 7,
      radius: 12,
      title: 'Soft'
    });
    assert.equal(parseImageTitle('iso,rx:0').radius, 0);
  });

  it('detects iso-grid and keeps iso + skew parsing', () => {
    assert.deepEqual(parseImageTitle('iso-grid'), {
      isometric: true,
      half: false,
      isoGrid: true,
      skewX: null,
      skewY: null,
      radius: null,
      title: ''
    });
    assert.deepEqual(parseImageTitle('iso-grid,-10,7 Cards'), {
      isometric: true,
      half: false,
      isoGrid: true,
      skewX: -10,
      skewY: 7,
      radius: null,
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
        skewX: null,
        skewY: null,
        radius: null,
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

describe('isoSkewOverrideStyle', () => {
  it('emits CSS vars for provided axes', () => {
    assert.equal(
      isoSkewOverrideStyle(-10, 7),
      ' style="--config-iso-skew-x-base:-10deg;--config-iso-skew-x:-10deg;--config-iso-skew-y-base:7deg;--config-iso-skew-y:7deg"'
    );
  });

  it('emits native soft radius when provided', () => {
    assert.equal(isoSkewOverrideStyle(null, null, 8), ' style="--config-iso-radius:8px"');
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

  it('wraps iso images with extrusion chrome', () => {
    const html = renderMarkdownImage({
      src: 'a.png',
      alt: 'A',
      title: 'iso Caption'
    });
    assert.match(html, /prose-img-iso/);
    assert.match(html, /prose-img-iso__extrusion/);
    assert.match(html, /Caption/);
    assert.doesNotMatch(html, /prose-img-iso--grid/);
  });

  it('marks iso-grid figures for collage layout', () => {
    const html = renderMarkdownImage({
      src: 'a.png',
      alt: 'A',
      title: 'iso-grid'
    });
    assert.match(html, /prose-img-iso prose-img-iso--grid/);
    assert.match(html, /prose-img-iso__extrusion/);
  });

  it('locks soft radius from title onto the frame', () => {
    const html = renderMarkdownImage({
      src: './src/card.svg',
      alt: 'Card',
      title: 'iso,r4'
    });
    assert.match(html, /--config-iso-radius:4px/);
    assert.match(html, /data-iso-radius-locked="1"/);
  });

  it('soft-rounds svg iso sources', () => {
    const html = renderMarkdownImage({
      src: './src/card.svg',
      alt: 'Card',
      title: 'iso'
    });
    assert.match(html, /prose-img-iso__frame--soft/);
  });

  it('keeps raster iso frames sharp', () => {
    const html = renderMarkdownImage({
      src: './src/shot.png',
      alt: 'Shot',
      title: 'iso'
    });
    assert.doesNotMatch(html, /prose-img-iso__frame--soft/);
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

describe('isSoftIsoSource', () => {
  it('detects svg paths and data urls', () => {
    assert.equal(isSoftIsoSource('./a.svg'), true);
    assert.equal(isSoftIsoSource('./a.SVG?v=1'), true);
    assert.equal(isSoftIsoSource('data:image/svg+xml;utf8,<svg></svg>'), true);
    assert.equal(isSoftIsoSource('./a.png'), false);
  });
});

test('parseImageTitle accepts isometric alias', () => {
  assert.equal(parseImageTitle('isometric').isometric, true);
  assert.equal(parseImageTitle('ISO').isometric, true);
});
