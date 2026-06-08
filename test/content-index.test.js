import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContentIndex, shouldIncludeCaseStudyFile } from '../lib/content-catalog.js';
import { buildContentIndexPayload, contentRevision, scanContentCaseStudies } from '../lib/content-index-node.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('shouldIncludeCaseStudyFile skips dotfiles and meta markdown', () => {
  assert.equal(shouldIncludeCaseStudyFile('.draft.md'), false);
  assert.equal(shouldIncludeCaseStudyFile('README.md'), false);
  assert.equal(shouldIncludeCaseStudyFile('CONTENT.md'), false);
  assert.equal(shouldIncludeCaseStudyFile('atolls.md'), true);
});

test('normalizeContentIndex normalizes paths', () => {
  const index = normalizeContentIndex({
    cases: ['/content/a.md', { path: 'content/b.md' }]
  });
  assert.deepEqual(index.cases, ['content/a.md', 'content/b.md']);
});

test('normalizeContentIndex requires cases', () => {
  assert.throws(() => normalizeContentIndex({ cases: [] }), /no case studies/);
});

test('contentRevision is stable until files change', () => {
  const cases = ['content/a.md', 'content/b.md'];
  const first = contentRevision(cases, repoRoot, []);
  const second = contentRevision(cases, repoRoot, []);
  assert.equal(first, second);
});

test('buildContentIndexPayload includes revision', () => {
  const payload = buildContentIndexPayload('content', repoRoot);
  assert.ok(typeof payload.revision === 'string' && payload.revision.length > 0);
  assert.ok(Array.isArray(payload.cases) && payload.cases.length > 0);
});

test('scanContentCaseStudies finds bundled case studies', () => {
  const paths = scanContentCaseStudies('content', repoRoot);
  assert.ok(paths.some((p) => p.endsWith('example-case-study.md')));
  assert.ok(paths.some((p) => p.endsWith('atolls-design-system-case-study.md')));
  assert.ok(!paths.some((p) => /CONTENT\.md$/i.test(p)));
});
