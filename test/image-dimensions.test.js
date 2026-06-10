import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildAssetDimensionsMap,
  parseImageDimensions,
  readImageDimensions
} from '../lib/image-dimensions-node.js';

test('parseImageDimensions reads PNG IHDR size', () => {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x01, 0x2c, 0x00, 0x00, 0x00, 0x96
  ]);
  assert.deepEqual(parseImageDimensions(png), [300, 150]);
});

test('readImageDimensions reads a repo content PNG', () => {
  const file = join(process.cwd(), 'content/src/atolls-ds-storybook.png');
  const dims = readImageDimensions(file);
  assert.ok(dims);
  assert.ok(dims[0] > 0);
  assert.ok(dims[1] > 0);
});

test('buildAssetDimensionsMap includes content images', () => {
  const map = buildAssetDimensionsMap();
  assert.ok(Object.keys(map).length > 0);
  assert.ok(map['content/src/atolls-ds-storybook.png']);
});

test('readImageDimensions matches file header parse', () => {
  const file = join(process.cwd(), 'content/src/atolls-ds-storybook.png');
  const fromFile = readImageDimensions(file);
  const fromBuf = parseImageDimensions(readFileSync(file));
  assert.deepEqual(fromFile, fromBuf);
});
