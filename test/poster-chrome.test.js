import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundForSlug } from '../lib/grounds.js';
import { getTitleFaces, titleFaceForIndex } from '../lib/title-faces.js';
import { fontsHrefFromConfig, setGalleryConfig } from '../lib/gallery-config.js';

test('groundForSlug avoids immediate repeat in sequence', () => {
  const slugs = ['atolls-design-system-case-study', 'zenrooms-app'];
  const first = groundForSlug(slugs[0]);
  const second = groundForSlug(slugs[1], first);
  assert.notEqual(first, second);
});

test('groundForSlug avoids grounds used in the last two posters', () => {
  const slug = 'repeat-candidate';
  const preferred = groundForSlug(slug);
  const recent = ['ground-pink', preferred];
  const next = groundForSlug(slug, preferred, recent);
  assert.notEqual(next, preferred);
  assert.notEqual(next, 'ground-pink');
});

test('groundForSlug keeps slug-stable pick when no recent grounds conflict', () => {
  const slug = 'content-01-figlets-mcp';
  assert.equal(groundForSlug(slug), groundForSlug(slug, null, []));
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

test('getTitleFaces skips faces with enabled:false', () => {
  setGalleryConfig({
    fonts: {
      titleFaces: [
        { id: 'space-grotesk', google: 'Space+Grotesk' },
        { id: 'ultra', enabled: false, google: 'Ultra' },
        { id: 'anton', google: 'Anton' }
      ]
    }
  });
  const ids = getTitleFaces().map((f) => f.id);
  assert.deepEqual(ids, ['space-grotesk', 'anton']);
  assert.doesNotMatch(fontsHrefFromConfig(), /Ultra/);
});
