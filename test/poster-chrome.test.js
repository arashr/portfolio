import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundForSlug } from '../lib/grounds.js';
import { titleFaceForIndex } from '../lib/title-faces.js';
import { setGalleryConfig } from '../lib/gallery-config.js';

test('groundForSlug avoids immediate repeat in sequence', () => {
  const slugs = ['atolls-design-system-case-study', 'zenrooms-app'];
  const first = groundForSlug(slugs[0]);
  const second = groundForSlug(slugs[1], first);
  assert.notEqual(first, second);
});

test('groundForSlug keeps existing slugs when a new ground is added to config', () => {
  const slugs = [
    'content-01-figlets-mcp',
    'content-02-atolls-design-system-case-study',
    'content-03-atolls-conversion-growth',
    'content-04-zenrooms-conversion-boost',
    'content-05-zenrooms-app',
    'content-06-zenrooms-hotel-rms'
  ];
  const withoutGreen = {
    grounds: {
      pink: {},
      white: {},
      lime: {},
      tangerine: {},
      lilac: {},
      butter: {},
      mint: {},
      carmine: {}
    }
  };
  const withGreen = { grounds: { ...withoutGreen.grounds, green: {} } };

  setGalleryConfig(withoutGreen);
  const before = slugs.map((slug) => groundForSlug(slug));

  setGalleryConfig(withGreen);
  const after = slugs.map((slug) => groundForSlug(slug));

  assert.deepEqual(after, before);
});

test('titleFaceForIndex avoids immediate repeat when index maps to same face', () => {
  const faces = 3;
  const first = titleFaceForIndex(0);
  const second = titleFaceForIndex(faces, first.id);
  assert.notEqual(first.id, second.id);
});
