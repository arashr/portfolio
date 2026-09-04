import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSocialMetaTags } from '../lib/social-meta.js';

test('buildSocialMetaTags emits Open Graph and Twitter tags with absolute image URL', () => {
  const html = buildSocialMetaTags({
    title: 'Arash Ranjbaran',
    ogTitle: 'Arash Ranjbaran | Portfolio',
    tagline: 'Product Design · Berlin',
    description: 'Case studies in product design, design systems, and growth.',
    url: 'https://arash.design/'
  });
  assert.match(html, /property="og:title" content="Arash Ranjbaran \| Portfolio"/);
  assert.match(html, /property="og:url" content="https:\/\/arash\.design\/"/);
  assert.match(html, /property="og:image" content="https:\/\/arash\.design\/og-image\.png"/);
  assert.match(html, /name="twitter:title" content="Arash Ranjbaran \| Portfolio"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});

test('buildSocialMetaTags prefers ogTitle over title for social cards', () => {
  const html = buildSocialMetaTags({
    title: 'Arash Ranjbaran',
    ogTitle: 'Arash Ranjbaran | Portfolio',
    url: 'https://arash.design'
  });
  assert.match(html, /property="og:title" content="Arash Ranjbaran \| Portfolio"/);
  assert.doesNotMatch(html, /property="og:title" content="Arash Ranjbaran"/);
});
