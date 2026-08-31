import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  posterGridRhythm,
  snapPackStart,
  snapStackGap,
  snapToRowLine,
  snapToRowLineCeil
} from '../lib/poster-row-snap.js';

describe('poster-row-snap', () => {
  it('snaps offsets onto the module+gutter period', () => {
    assert.equal(snapToRowLine(0, 48), 0);
    assert.equal(snapToRowLine(20, 48), 0);
    assert.equal(snapToRowLine(30, 48), 48);
    assert.equal(snapToRowLineCeil(49, 48), 96);
  });

  it('varies start row on the module grid by rhythm', () => {
    const a = snapPackStart(480, 200, 48, 'vary', 1);
    const b = snapPackStart(480, 200, 48, 'vary', 4);
    assert.equal(a % 48, 0);
    assert.equal(b % 48, 0);
    assert.ok(b > a);
  });

  it('grows the stack gap so the body top hits a row line', () => {
    const gap = snapStackGap(100, 48, 24, 48);
    assert.ok(gap >= 24);
    assert.equal((48 + 100 + gap) % 48, 0);
  });

  it('recognizes landing name band as rhythm 1', () => {
    const card = {
      closest(selector) {
        if (selector !== '.post-card-wrap') return null;
        return { id: 'landing-name', classList: { contains: () => false } };
      }
    };
    assert.equal(posterGridRhythm(card), 1);
  });
});
