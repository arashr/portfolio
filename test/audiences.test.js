import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAudienceToCasePaths,
  buildAppUrl,
  casePathMatchesRef,
  caseStudyAlias,
  caseStudyStem,
  normalizeAudiencesConfig,
  readAudienceIdFromLocation,
  resolveAudienceId
} from '../lib/audiences.js';

const CATALOG = [
  'content/01-figlets-mcp.md',
  'content/02-atolls-design-system-case-study.md',
  'content/03-atolls-conversion-growth.md',
  'content/04-zenrooms-conversion-boost.md',
  'content/05-zenrooms-app.md',
  'content/06-zenrooms-hotel-rms.md'
];

const CONFIG = normalizeAudiencesConfig({
  defaultAudience: 'default',
  audiences: {
    default: {
      cases: [
        '01-figlets-mcp',
        '02-atolls-design-system-case-study',
        '03-atolls-conversion-growth',
        '05-zenrooms-app',
        '04-zenrooms-conversion-boost',
        '06-zenrooms-hotel-rms'
      ]
    },
    systems: {
      label: 'Design systems',
      cases: [
        '02-atolls-design-system-case-study',
        'figlets-mcp',
        '06-zenrooms-hotel-rms',
        '03-atolls-conversion-growth'
      ]
    },
    growth: {
      cases: [
        '03-atolls-conversion-growth',
        '04-zenrooms-conversion-boost',
        '02-atolls-design-system-case-study',
        '01-figlets-mcp'
      ]
    }
  }
});

test('caseStudyStem and alias strip path and order prefix', () => {
  assert.equal(caseStudyStem('content/01-figlets-mcp.md'), '01-figlets-mcp');
  assert.equal(caseStudyAlias('01-figlets-mcp'), 'figlets-mcp');
});

test('casePathMatchesRef accepts stem, alias, and path forms', () => {
  const path = 'content/01-figlets-mcp.md';
  assert.equal(casePathMatchesRef(path, '01-figlets-mcp'), true);
  assert.equal(casePathMatchesRef(path, 'figlets-mcp'), true);
  assert.equal(casePathMatchesRef(path, 'content/01-figlets-mcp'), true);
  assert.equal(casePathMatchesRef(path, 'zenrooms-app'), false);
});

test('readAudienceIdFromLocation reads ?for=', () => {
  assert.equal(readAudienceIdFromLocation({ search: '?for=systems' }), 'systems');
  assert.equal(readAudienceIdFromLocation({ search: '?for=Growth&x=1' }), 'growth');
  assert.equal(readAudienceIdFromLocation({ search: '' }), null);
  assert.equal(readAudienceIdFromLocation('https://example.com/?for=mobile#read'), 'mobile');
});

test('resolveAudienceId falls back to default for unknown slugs', () => {
  assert.equal(resolveAudienceId(CONFIG, 'systems'), 'systems');
  assert.equal(resolveAudienceId(CONFIG, 'nope'), 'default');
  assert.equal(resolveAudienceId(CONFIG, null), 'default');
});

test('applyAudienceToCasePaths reorders and soft-hides', () => {
  const systems = applyAudienceToCasePaths(CATALOG, CONFIG, 'systems');
  assert.equal(systems.audienceId, 'systems');
  assert.deepEqual(systems.paths, [
    'content/02-atolls-design-system-case-study.md',
    'content/01-figlets-mcp.md',
    'content/06-zenrooms-hotel-rms.md',
    'content/03-atolls-conversion-growth.md'
  ]);
  assert.equal(systems.paths.includes('content/05-zenrooms-app.md'), false);
});

test('applyAudienceToCasePaths uses default for unknown ?for=', () => {
  const result = applyAudienceToCasePaths(CATALOG, CONFIG, 'unknown');
  assert.equal(result.audienceId, 'default');
  assert.equal(result.paths[0], 'content/01-figlets-mcp.md');
  assert.equal(result.paths[3], 'content/05-zenrooms-app.md');
});

test('buildAppUrl preserves query and sets for', () => {
  assert.equal(
    buildAppUrl({ pathname: '/portfolio/', search: '?for=systems', hash: '#' }, { hash: '#read' }),
    '/portfolio/?for=systems#read'
  );
  assert.equal(
    buildAppUrl(
      { pathname: '/', search: '?for=systems', hash: '#read' },
      { hash: '#', audienceId: 'default', defaultAudience: 'default' }
    ),
    '/#'
  );
  assert.equal(
    buildAppUrl(
      { pathname: '/', search: '', hash: '#' },
      { hash: '#', audienceId: 'mobile', defaultAudience: 'default' }
    ),
    '/?for=mobile#'
  );
});

test('normalizeAudiencesConfig tolerates empty/invalid input', () => {
  const empty = normalizeAudiencesConfig(null);
  assert.equal(empty.defaultAudience, 'default');
  assert.ok(empty.audiences.default);
});
