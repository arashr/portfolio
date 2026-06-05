import { readdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import {
  CONTENT_DIR,
  CONTENT_INDEX_PATH,
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
 * @param {string} [contentDir]
 * @param {string} [repoRoot]
 */
export function buildContentIndexPayload(contentDir = CONTENT_DIR, repoRoot = process.cwd()) {
  return {
    generatedAt: new Date().toISOString(),
    cases: scanContentCaseStudies(contentDir, repoRoot)
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
