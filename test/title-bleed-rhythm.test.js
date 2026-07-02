import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickBleedSymbol,
  resolveTitleBleedSymbolPool,
  titleToBleedRhythm
} from '../lib/title-bleed-rhythm.js';

test('titleToBleedRhythm mirrors word lengths with one symbol', () => {
  assert.equal(titleToBleedRhythm('The Challenge', '/'), '/// /////////');
  assert.equal(titleToBleedRhythm('A B', '*'), '* *');
  assert.equal(titleToBleedRhythm('  Hello   World  ', '|'), '||||| |||||');
});

test('titleToBleedRhythm returns empty for blank titles', () => {
  assert.equal(titleToBleedRhythm('', '/'), '');
  assert.equal(titleToBleedRhythm('   ', '/'), '');
});

test('pickBleedSymbol chooses from pool', () => {
  assert.equal(pickBleedSymbol('/|#', () => 0), '/');
  assert.equal(pickBleedSymbol('/|#', () => 0.99), '#');
});

test('resolveTitleBleedSymbolPool prefers reader config', () => {
  assert.equal(
    resolveTitleBleedSymbolPool({
      reader: { titleBleed: { symbolPool: 'ABC' } },
      theme: { graphics: { typePattern: { symbolPool: 'XYZ' } } }
    }),
    'ABC'
  );
  assert.equal(
    resolveTitleBleedSymbolPool({
      theme: { graphics: { typePattern: { symbol: { pool: 'XYZ' } } } }
    }),
    'XYZ'
  );
});
