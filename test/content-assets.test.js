import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contentDirectoryForMarkdown,
  getAppBasePath,
  joinSiteRoot,
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

test('getAppBasePath detects GitHub Pages project subpath', () => {
  assert.equal(getAppBasePath({ pathname: '/' }), '/');
  assert.equal(getAppBasePath({ pathname: '/portfolio/' }), '/portfolio/');
  assert.equal(getAppBasePath({ pathname: '/portfolio' }), '/portfolio/');
  assert.equal(getAppBasePath({ pathname: '/portfolio/index.html' }), '/portfolio/');
});

test('joinSiteRoot prefixes project subpath', () => {
  assert.equal(joinSiteRoot('/', 'content/src/hero.png'), '/content/src/hero.png');
  assert.equal(
    joinSiteRoot('/portfolio/', 'content/src/hero.png'),
    '/portfolio/content/src/hero.png'
  );
});

test('resolveContentAssetUrl respects GitHub Pages base path', () => {
  assert.equal(
    resolveContentAssetUrl('src/hero.png', 'content/example-case-study.md', '/portfolio/'),
    '/portfolio/content/src/hero.png'
  );
  assert.equal(
    resolveContentAssetUrl('/assets/x.jpg', 'content/a.md', '/portfolio/'),
    '/portfolio/assets/x.jpg'
  );
});
