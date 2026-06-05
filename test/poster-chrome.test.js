import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundForSlug } from '../lib/grounds.js';
import { titleFaceForIndex } from '../lib/title-faces.js';

test('groundForSlug avoids immediate repeat in sequence', () => {
  const slugs = ['atolls-design-system-case-study', 'zenrooms-app'];
  const first = groundForSlug(slugs[0]);
  const second = groundForSlug(slugs[1], first);
  assert.notEqual(first, second);
});

test('titleFaceForIndex avoids immediate repeat when index maps to same face', () => {
  const faces = 3;
  const first = titleFaceForIndex(0);
  const second = titleFaceForIndex(faces, first.id);
  assert.notEqual(first.id, second.id);
});
