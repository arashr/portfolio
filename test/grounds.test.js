import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getGalleryConfig, setGalleryConfig } from '../lib/gallery-config.js';
import {
  getGroundKeys,
  getGrounds,
  groundClassFromToken,
  groundForSlug,
  normalizeGroundKey,
  resolveSequencedGround
} from '../lib/grounds.js';

test('disabled grounds remain configured but leave the active palette', () => {
  setGalleryConfig({
    grounds: {
      pink: {},
      white: { enabled: false },
      lime: {}
    }
  });

  assert.deepEqual(getGroundKeys(), ['pink', 'lime']);
  assert.deepEqual(getGrounds(), ['ground-pink', 'ground-lime']);
  assert.ok(getGalleryConfig().grounds.white);
  assert.equal(getGalleryConfig().grounds.white.enabled, false);
});

test('normalizeGroundKey accepts bare and ground-prefixed tokens', () => {
  assert.equal(normalizeGroundKey('indigo'), 'indigo');
  assert.equal(normalizeGroundKey('ground-indigo'), 'indigo');
  assert.equal(normalizeGroundKey('  Ground-Lime  '), 'lime');
  assert.equal(normalizeGroundKey('not-a-ground'), null);
  assert.equal(normalizeGroundKey(''), null);
  assert.equal(normalizeGroundKey(null), null);
});

test('groundClassFromToken returns class names for known tokens only', () => {
  assert.equal(groundClassFromToken('indigo'), 'ground-indigo');
  assert.equal(groundClassFromToken('ground-pink'), 'ground-pink');
  assert.equal(groundClassFromToken('unknown'), null);
});

test('groundForSlug still avoids recent grounds when some grounds are disabled', () => {
  setGalleryConfig({
    grounds: {
      pink: {},
      white: { enabled: false },
      lime: {},
      tangerine: {},
      lilac: {},
      butter: {},
      mint: {},
      carmine: {},
      indigo: {}
    }
  });

  const slug = 'repeat-candidate';
  const preferred = groundForSlug(slug);
  assert.notEqual(preferred, 'ground-white');

  const recent = ['ground-pink', preferred];
  const next = groundForSlug(slug, preferred, recent);
  assert.notEqual(next, preferred);
  assert.notEqual(next, 'ground-pink');
  assert.notEqual(next, 'ground-white');
});

test('resolveSequencedGround uses cover when it does not collide', () => {
  const ground = resolveSequencedGround('any-slug', 'ground-pink', ['ground-lime', 'ground-pink'], 'indigo');
  assert.equal(ground, 'ground-indigo');
});

test('resolveSequencedGround skips cover that repeats a recent ground', () => {
  const slug = 'content-06-zenrooms-hotel-rms';
  const previous = 'ground-carmine';
  const recent = ['ground-butter', 'ground-carmine'];
  const ground = resolveSequencedGround(slug, previous, recent, 'carmine');
  assert.notEqual(ground, 'ground-carmine');
  assert.equal(ground, groundForSlug(slug, previous, recent));
});
