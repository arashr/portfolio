import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReaderMoreCases } from '../lib/render-reader-more-cases.js';

test('renderReaderMoreCases returns empty string for no items', () => {
  assert.equal(renderReaderMoreCases([]), '');
});

test('renderReaderMoreCases emits aligned wrap and mini-poster picks', () => {
  const html = renderReaderMoreCases(
    [
      {
        path: 'content/02-other.md',
        title: 'Other Study',
        index: 1,
        subtext: 'A short lede',
        stats: [],
        credit: ''
      }
    ],
    { colStart: 3 }
  );
  assert.match(html, /reader-more-cases-wrap/);
  assert.match(html, /--poster-col-start: 3/);
  assert.match(html, /reader-more-cases__grid/);
  assert.match(html, /landing-pick-card/);
  assert.match(html, /data-md-path="content\/02-other.md"/);
  assert.match(html, /landing-pick-more/);
});
