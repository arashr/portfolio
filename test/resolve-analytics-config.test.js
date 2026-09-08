import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_DEFAULTS,
  resolveAnalyticsConfig,
  sanitizeProjectToken
} from '../lib/resolve-analytics-config.js';

test('sanitizeProjectToken allows only phc_ project tokens', () => {
  assert.equal(sanitizeProjectToken('phc_abc123'), 'phc_abc123');
  assert.equal(sanitizeProjectToken('  phc_abc123  '), 'phc_abc123');
  assert.equal(sanitizeProjectToken('phx_personal'), '');
  assert.equal(sanitizeProjectToken('phs_secret'), '');
  assert.equal(sanitizeProjectToken('not-a-token'), '');
  assert.equal(sanitizeProjectToken(''), '');
});

test('resolveAnalyticsConfig stays disabled without a project token', () => {
  const cfg = resolveAnalyticsConfig(
    { posthog: { enabled: true, projectToken: '' } },
    {},
    {}
  );
  assert.equal(cfg.posthog.enabled, false);
  assert.equal(cfg.posthog.apiHost, ANALYTICS_DEFAULTS.apiHost);
});

test('resolveAnalyticsConfig enables when env supplies a phc_ token', () => {
  const cfg = resolveAnalyticsConfig(
    { posthog: { enabled: false } },
    {},
    { POSTHOG_PROJECT_TOKEN: 'phc_from_env', POSTHOG_ENABLED: 'true' }
  );
  assert.equal(cfg.posthog.enabled, true);
  assert.equal(cfg.posthog.projectToken, 'phc_from_env');
});

test('resolveAnalyticsConfig strips personal keys even if enabled', () => {
  const cfg = resolveAnalyticsConfig(
    { posthog: { enabled: true, projectToken: 'phx_nope' } },
    {},
    { POSTHOG_ENABLED: 'true' }
  );
  assert.equal(cfg.posthog.projectToken, '');
  assert.equal(cfg.posthog.enabled, false);
});
