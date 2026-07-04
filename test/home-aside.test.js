import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseHomeAside } from '../lib/parse-home-aside.js';
import { renderLandingMosaic } from '../lib/render-landing-mosaic.js';
import { shouldIncludeCaseStudyFile } from '../lib/content-catalog.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('shouldIncludeCaseStudyFile skips home-aside.md', () => {
  assert.equal(shouldIncludeCaseStudyFile('home-aside.md'), false);
});

test('parseHomeAside reads ## sections from bundled file', () => {
  const text = readFileSync(join(repoRoot, 'content/home-aside.md'), 'utf8');
  const { sections } = parseHomeAside(text);
  assert.equal(sections.length, 4);
  assert.equal(sections[0].title, 'I Design Systems, Not Just Screens');
  assert.match(sections[0].description, /single layout/);
  assert.equal(sections[3].title, 'I Use AI Where It Actually Helps');
});

test('renderLandingMosaic includes aside sections in the poster grid', () => {
  const html = renderLandingMosaic({
    site: { title: 'Portfolio', tagline: 'Case studies' },
    items: [],
    aside: { sections: [{ title: 'Test', description: 'Body copy.' }] }
  });
  assert.match(html, /landing-aside-wrap/);
  assert.match(html, /Test/);
  assert.match(html, /Body copy/);
});
