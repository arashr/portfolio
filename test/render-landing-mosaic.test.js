import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLandingMosaic } from '../lib/render-landing-mosaic.js';

test('renderLandingMosaic uses indigo hero band and trio case rows', () => {
  const html = renderLandingMosaic({
    site: { title: 'Arash Ranjbaran', tagline: 'Product Design · Berlin' },
    items: [
      { path: 'a.md', title: 'Alpha', index: 0 },
      { path: 'b.md', title: 'Beta', index: 1 },
      { path: 'c.md', title: 'Gamma', index: 2 },
      { path: 'd.md', title: 'Delta', index: 3 },
      { path: 'e.md', title: 'Epsilon', index: 4 },
      { path: 'f.md', title: 'Zeta', index: 5 }
    ],
    aside: {
      sections: [{ title: 'Aside One', description: 'First aside.' }]
    }
  });

  assert.match(html, /landing-mosaic__hero-band/);
  assert.match(html, /landing-mosaic__hero.*ground-indigo/);
  assert.match(html, /data-glyph-canvas/);
  assert.match(html, /landing-mosaic__cases/);
  assert.match(html, /landing-mosaic__row--trio-0/);
  assert.match(html, /landing-mosaic__row--trio-1/);
  assert.doesNotMatch(html, /ground-white.*landing-mosaic__hero/);

  const heroEnd = html.indexOf('landing-mosaic__cases');
  const firstCase = html.indexOf('data-md-path="a.md"');
  assert.ok(heroEnd > 0 && firstCase > heroEnd);

  const notesStart = html.indexOf('landing-mosaic__notes');
  const lastCase = html.lastIndexOf('data-md-path');
  assert.ok(notesStart > lastCase);
});
