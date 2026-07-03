import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLandingMosaic } from '../lib/render-landing-mosaic.js';

test('renderLandingMosaic uses indigo name band and reader-style poster stack', () => {
  const html = renderLandingMosaic({
    site: { title: 'Arash Ranjbaran', tagline: 'Product Design · Berlin' },
    items: [
      { path: 'a.md', title: 'Alpha', index: 0, subtext: 'Lead', stats: [{ label: 'Lift', value: '12%' }] },
      { path: 'b.md', title: 'Beta', index: 1 }
    ],
    aside: {
      sections: [{ title: 'Aside One', description: 'First aside.' }]
    }
  });

  assert.match(html, /id="landing-name"/);
  assert.match(html, /ground-indigo.*landing-name-card/);
  assert.match(html, /title-face-bricolage-grotesque/);
  assert.match(html, /id="landing-posters"/);
  assert.match(html, /post-card-wrap/);
  assert.match(html, /landing-pick-card.*data-md-path="a\.md"/);
  assert.match(html, /landing-pick-more/);
  assert.match(html, /READ MORE/);
  assert.match(html, /table-wrap/);
  assert.match(html, /data-glyph-canvas/);
  assert.match(html, /landing-aside-wrap/);
  assert.match(html, /post-card__title-bleed/);
  assert.doesNotMatch(html, /collection-hero/);
  assert.doesNotMatch(html, /landing-mosaic__row/);
  assert.doesNotMatch(html, /mini-poster/);

  const nameStart = html.indexOf('id="landing-name"');
  const postersStart = html.indexOf('id="landing-posters"');
  const firstCase = html.indexOf('data-md-path="a.md"');
  const firstBleed = html.indexOf('post-card__title-bleed');
  assert.ok(nameStart >= 0 && postersStart > nameStart);
  assert.ok(firstCase > postersStart);
  assert.ok(firstBleed > postersStart && firstBleed < firstCase);
});
