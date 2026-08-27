import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from '../lib/parse-document.js';
import { renderDocument } from '../lib/render-document.js';

test('renderDocument uses first-poster ground override and emits glyph symbol', () => {
  const doc = parseDocument(
    `---
title: Cover Case
ground: indigo
symbol: /
---

# Cover Case

Intro.

## Later

Body.
`,
    'cover.md'
  );

  const html = renderDocument(doc, 'cover.md');
  assert.match(html, /class="post-card-wrap ground-indigo"/);
  assert.match(html, /data-glyph-symbol="\/"/);
  assert.match(html, /data-slug="later"/);
  assert.doesNotMatch(html, /data-slug="later"[^>]*data-glyph-symbol/);
});

test('renderDocument escapes glyph symbols in attributes', () => {
  const doc = parseDocument(
    `---
title: Escaped
ground: pink
symbol: <
---

# Escaped

Intro.

## Next

Body.
`,
    'escaped.md'
  );

  const html = renderDocument(doc, 'escaped.md');
  assert.match(html, /data-glyph-symbol="&lt;"/);
});

test('renderDocument keeps recent-ground avoidance after an explicit cover ground', () => {
  const doc = {
    title: 'Sequence',
    introMarkdown: '',
    posters: [
      {
        index: 0,
        title: 'Cover',
        plainTitle: 'Cover',
        slug: 'cover',
        bodyMarkdown: 'One.',
        groundKey: 'indigo',
        isIntroPoster: true
      },
      {
        index: 1,
        title: 'Second',
        plainTitle: 'Second',
        slug: 'second-poster-avoid',
        bodyMarkdown: 'Two.'
      },
      {
        index: 2,
        title: 'Third',
        plainTitle: 'Third',
        slug: 'third-poster-avoid',
        bodyMarkdown: 'Three.'
      }
    ],
    toc: [],
    splitMode: 'h2'
  };

  const html = renderDocument(doc, 'sequence.md');
  const grounds = [...html.matchAll(/class="post-card-wrap (ground-[\w-]+)/g)].map((m) => m[1]);
  assert.equal(grounds[0], 'ground-indigo');
  assert.notEqual(grounds[1], grounds[0]);
  assert.notEqual(grounds[2], grounds[1]);
});
