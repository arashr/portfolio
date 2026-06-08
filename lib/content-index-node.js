import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import {
  CONTENT_DIR,
  CONTENT_INDEX_PATH,
  SITE_CONFIG_PATH,
  shouldIncludeCaseStudyFile
} from './content-catalog.js';
import { normalizeRelativePath } from './local-md-links.js';

/**
 * Recursively list case-study markdown paths under `content/`.
 *
 * @param {string} [contentDir]
 * @param {string} [repoRoot]
 */
export function scanContentCaseStudies(contentDir = CONTENT_DIR, repoRoot = process.cwd()) {
  const root = join(repoRoot, contentDir);
  /** @type {string[]} */
  const paths = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.startsWith('.')) continue;
        walk(full);
        continue;
      }
      if (!ent.isFile()) continue;
      const relPath = normalizeRelativePath(relative(repoRoot, full).replace(/\\/g, '/'));
      if (!shouldIncludeCaseStudyFile(ent.name, relPath)) continue;
      paths.push(relPath);
    }
  }

  walk(root);
  return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * Stable fingerprint for change detection — only shifts when watched files change.
 *
 * @param {string[]} cases
 * @param {string} [repoRoot]
 * @param {string[]} [extraPaths]
 */
export function contentRevision(cases, repoRoot = process.cwd(), extraPaths = [SITE_CONFIG_PATH]) {
  const parts = [];
  for (const rel of [...cases].sort((a, b) => a.localeCompare(b))) {
    const full = join(repoRoot, rel);
    try {
      const stat = statSync(full);
      parts.push(`${rel}:${stat.mtimeMs}:${stat.size}`);
    } catch {
      parts.push(`${rel}:missing`);
    }
  }
  for (const rel of extraPaths) {
    const full = join(repoRoot, rel);
    if (!existsSync(full)) continue;
    try {
      const stat = statSync(full);
      parts.push(`${rel}:${stat.mtimeMs}:${stat.size}`);
    } catch {
      parts.push(`${rel}:unreadable`);
    }
  }
  return parts.join('|');
}

/**
 * @param {string} [contentDir]
 * @param {string} [repoRoot]
 */
export function buildContentIndexPayload(contentDir = CONTENT_DIR, repoRoot = process.cwd()) {
  const cases = scanContentCaseStudies(contentDir, repoRoot);
  return {
    generatedAt: new Date().toISOString(),
    revision: contentRevision(cases, repoRoot),
    cases
  };
}

/**
 * @param {string} [outPath]
 * @param {string} [contentDir]
 * @param {string} [repoRoot]
 */
export function writeContentIndex(outPath = CONTENT_INDEX_PATH, contentDir = CONTENT_DIR, repoRoot = process.cwd()) {
  const payload = buildContentIndexPayload(contentDir, repoRoot);
  if (!payload.cases.length) {
    throw new Error(`No case studies found under ${contentDir}/`);
  }
  writeFileSync(join(repoRoot, outPath), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}
