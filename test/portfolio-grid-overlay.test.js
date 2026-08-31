import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { portfolioGridOverlayMode } from '../lib/gallery-config.js';

describe('portfolioGridOverlayMode', () => {
  it('returns empty when disabled', () => {
    assert.equal(portfolioGridOverlayMode({ enabled: false, columns: true, rows: true }), '');
    assert.equal(portfolioGridOverlayMode(undefined), '');
  });

  it('returns both when columns and rows are on', () => {
    assert.equal(portfolioGridOverlayMode({ enabled: true, columns: true, rows: true }), 'both');
  });

  it('returns columns or rows only', () => {
    assert.equal(portfolioGridOverlayMode({ enabled: true, columns: true, rows: false }), 'columns');
    assert.equal(portfolioGridOverlayMode({ enabled: true, columns: false, rows: true }), 'rows');
    assert.equal(portfolioGridOverlayMode({ enabled: true, columns: false, rows: false }), '');
  });
});
