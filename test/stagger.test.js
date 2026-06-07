import { test } from 'node:test';
import assert from 'node:assert/strict';
import { posterStaggerCol, POSTER_GRID_MAX_START, POSTER_GRID_SPAN } from '../lib/stagger.js';

test('posterStaggerCol returns a valid 1-based column start', () => {
  const col = posterStaggerCol('atolls-design-system-case-study', 0);
  assert.ok(col >= 1 && col <= POSTER_GRID_MAX_START);
  assert.equal(POSTER_GRID_SPAN, 6);
});

test('posterStaggerCol avoids immediate repeat', () => {
  const first = posterStaggerCol('zenrooms-app', 1);
  const second = posterStaggerCol('zenrooms-app', 1, first);
  assert.notEqual(first, second);
});
