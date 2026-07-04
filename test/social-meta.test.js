import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSocialMetaTags } from '../lib/social-meta.js';

test('buildSocialMetaTags emits Open Graph and Twitter tags with absolute image URL', () => {
  const html = buildSocialMetaTags({
    title: 'Arash Ranjbaran',
    tagline: 'Product Design · Berlin',
    description: 'Case studies in product design, design systems, and growth.',
    url: 'https://arashr.github.io/portfolio/'
  });
  assert.match(html, /property="og:title" content="Arash Ranjbaran"/);
  assert.match(html, /property="og:image" content="https:\/\/arashr\.github\.io\/portfolio\/og-image\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});
