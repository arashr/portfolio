import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseHomeAside } from '../lib/parse-home-aside.js';
import { renderHomeAside } from '../lib/render-home-aside.js';
import { shouldIncludeCaseStudyFile } from '../lib/content-catalog.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('shouldIncludeCaseStudyFile skips home-aside.md', () => {
  assert.equal(shouldIncludeCaseStudyFile('home-aside.md'), false);
});

test('parseHomeAside reads ## sections from bundled file', () => {
  const text = readFileSync(join(repoRoot, 'content/home-aside.md'), 'utf8');
  const { sections } = parseHomeAside(text);
  assert.equal(sections.length, 4);
  assert.equal(sections[0].title, 'Systems Thinking');
  assert.match(sections[0].description, /whole board/);
  assert.equal(sections[3].title, 'AI Native');
});

test('renderHomeAside outputs section blocks', () => {
  const html = renderHomeAside({
    sections: [{ title: 'Test', description: 'Body copy.' }]
  });
  assert.match(html, /landing-aside__title/);
  assert.match(html, /Test/);
  assert.match(html, /Body copy/);
});
