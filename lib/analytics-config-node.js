/**
 * Node helper: merge committed analytics.json + optional local override + env.
 * Used by the production build (and tests). Never logs token values.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveAnalyticsConfig } from './resolve-analytics-config.js';

/**
 * @param {string} repoRoot
 * @param {NodeJS.ProcessEnv} [env]
 */
export function loadAnalyticsConfigForBuild(repoRoot, env = process.env) {
  const basePath = join(repoRoot, 'config/analytics.json');
  const localPath = join(repoRoot, 'config/analytics.local.json');

  let base = {};
  let local = {};
  try {
    base = JSON.parse(readFileSync(basePath, 'utf8'));
  } catch {
    base = {};
  }
  if (existsSync(localPath)) {
    try {
      local = JSON.parse(readFileSync(localPath, 'utf8'));
    } catch {
      local = {};
    }
  }

  return resolveAnalyticsConfig(base, local, env);
}
