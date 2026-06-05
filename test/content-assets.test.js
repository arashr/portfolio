import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contentDirectoryForMarkdown,
  resolveContentAssetUrl
} from '../lib/content-assets.js';

test('contentDirectoryForMarkdown', () => {
  assert.equal(contentDirectoryForMarkdown('content/foo.md'), 'content');
  assert.equal(contentDirectoryForMarkdown('content/nested/bar.md'), 'content/nested');
});

test('resolveContentAssetUrl resolves beside markdown file', () => {
  assert.equal(
    resolveContentAssetUrl('src/hero.png', 'content/example-case-study.md'),
    '/content/src/hero.png'
  );
  assert.equal(
    resolveContentAssetUrl('./src/hero.png', 'content/example-case-study.md'),
    '/content/src/hero.png'
  );
});

test('resolveContentAssetUrl leaves absolute and remote URLs', () => {
  assert.equal(resolveContentAssetUrl('/assets/x.jpg', 'content/a.md'), '/assets/x.jpg');
  assert.equal(
    resolveContentAssetUrl('https://example.com/x.jpg', 'content/a.md'),
    'https://example.com/x.jpg'
  );
});
