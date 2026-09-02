import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLandingNameTitleScale, resolveTitleScaleForFace } from '../lib/gallery-config.js';
import { resolveTitleScaleTier } from '../lib/fit-poster-title.js';

test('landing name uses flat scale without length tiers', () => {
  const cfg = {
    landing: {
      header: {
        titleScale: {
          minPx: 100,
          maxPx: 160,
          maxWidthRatio: 0.6,
          maxLines: 1,
          maxPxRatio: 0.7
        }
      }
    },
    fonts: {
      titleScale: {
        minPx: 64,
        maxPx: 280,
        tiers: [{ maxChars: 18, maxPx: 120 }]
      },
      titleFaces: [
        {
          id: 'bricolage-grotesque',
          titleScale: { minPx: 32, maxPx: 120, tiers: [{ maxChars: 18, maxPx: 120 }] }
        }
      ]
    }
  };

  const landing = resolveLandingNameTitleScale(cfg);
  const face = resolveTitleScaleForFace('bricolage-grotesque', cfg);
  const nameTier = resolveTitleScaleTier(landing, 15);
  const faceTier = resolveTitleScaleTier(face, 15);

  assert.deepEqual(landing.tiers, []);
  assert.equal(nameTier.maxPx, 160);
  assert.equal(nameTier.maxLines, 1);
  assert.equal(faceTier.maxPx, 120);
});
