/** @typedef {{ label?: string, cases: string[] }} AudienceDef */
/** @typedef {{ defaultAudience: string, audiences: Record<string, AudienceDef> }} AudiencesConfig */

export const AUDIENCES_CONFIG_PATH = 'config/audiences.json';

/** @type {AudiencesConfig} */
export const DEFAULT_AUDIENCES_CONFIG = {
  defaultAudience: 'default',
  audiences: {
    default: { label: 'All case studies', cases: [] }
  }
};

/**
 * @param {unknown} raw
 * @returns {AudiencesConfig}
 */
export function normalizeAudiencesConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return structuredClone(DEFAULT_AUDIENCES_CONFIG);
  }

  const source = /** @type {Record<string, unknown>} */ (raw);
  /** @type {Record<string, AudienceDef>} */
  const audiences = {};

  const rawAudiences =
    source.audiences && typeof source.audiences === 'object' && !Array.isArray(source.audiences)
      ? /** @type {Record<string, unknown>} */ (source.audiences)
      : {};

  for (const [id, def] of Object.entries(rawAudiences)) {
    const key = String(id).trim().toLowerCase();
    if (!key) continue;
    if (!def || typeof def !== 'object' || Array.isArray(def)) continue;
    const entry = /** @type {Record<string, unknown>} */ (def);
    const cases = Array.isArray(entry.cases)
      ? entry.cases.map((c) => String(c).trim()).filter(Boolean)
      : [];
    audiences[key] = {
      label: entry.label != null ? String(entry.label) : undefined,
      cases
    };
  }

  if (!Object.keys(audiences).length) {
    return structuredClone(DEFAULT_AUDIENCES_CONFIG);
  }

  const requestedDefault =
    source.defaultAudience != null ? String(source.defaultAudience).trim().toLowerCase() : '';
  const defaultAudience =
    (requestedDefault && audiences[requestedDefault] && requestedDefault) ||
    (audiences.default ? 'default' : Object.keys(audiences)[0]);

  return { defaultAudience, audiences };
}

/**
 * Read `?for=` from a location-like object.
 * @param {{ search?: string } | string | null | undefined} [loc]
 */
export function readAudienceIdFromLocation(loc = globalThis.location) {
  const search =
    typeof loc === 'string'
      ? loc.startsWith('?')
        ? loc
        : new URL(loc, 'https://example.invalid').search
      : loc?.search ?? '';
  const value = new URLSearchParams(search).get('for');
  if (value == null) return null;
  const id = String(value).trim().toLowerCase();
  return id || null;
}

/**
 * @param {AudiencesConfig} config
 * @param {string | null | undefined} requestedId
 */
export function resolveAudienceId(config, requestedId) {
  const id = requestedId != null ? String(requestedId).trim().toLowerCase() : '';
  if (id && config.audiences[id]) return id;
  return config.defaultAudience;
}

/**
 * Basename stem without extension: `content/01-figlets-mcp.md` → `01-figlets-mcp`
 * @param {string} path
 */
export function caseStudyStem(path) {
  const base = String(path).split('/').pop() || String(path);
  return base.replace(/\.[^.]+$/, '');
}

/**
 * Strip leading `NN-` order prefix: `01-figlets-mcp` → `figlets-mcp`
 * @param {string} stem
 */
export function caseStudyAlias(stem) {
  return String(stem).replace(/^\d+-/, '');
}

/**
 * @param {string} casePath
 * @param {string} ref
 */
export function casePathMatchesRef(casePath, ref) {
  const needle = String(ref).trim().toLowerCase().replace(/\.md$/i, '');
  if (!needle) return false;

  const normalizedPath = String(casePath).replace(/\\/g, '/').replace(/^\//, '');
  const stem = caseStudyStem(normalizedPath).toLowerCase();
  const alias = caseStudyAlias(stem).toLowerCase();
  const pathNoExt = normalizedPath.replace(/\.md$/i, '').toLowerCase();

  if (needle === stem || needle === alias) return true;
  if (needle === pathNoExt || needle === `content/${stem}`) return true;
  if (pathNoExt.endsWith(`/${needle}`)) return true;
  return false;
}

/**
 * Reorder / filter case paths for an audience. Empty audience list → all cases, catalog order.
 * Unknown refs are skipped. Catalog paths not listed are omitted (soft-hide).
 *
 * @param {string[]} catalogPaths
 * @param {AudiencesConfig} config
 * @param {string | null | undefined} requestedId
 * @returns {{ audienceId: string, paths: string[], label?: string }}
 */
export function applyAudienceToCasePaths(catalogPaths, config, requestedId) {
  const audienceId = resolveAudienceId(config, requestedId);
  const def = config.audiences[audienceId] || config.audiences[config.defaultAudience];
  const refs = def?.cases || [];

  if (!refs.length) {
    return { audienceId, paths: [...catalogPaths], label: def?.label };
  }

  const remaining = [...catalogPaths];
  /** @type {string[]} */
  const paths = [];

  for (const ref of refs) {
    const idx = remaining.findIndex((path) => casePathMatchesRef(path, ref));
    if (idx < 0) continue;
    paths.push(remaining.splice(idx, 1)[0]);
  }

  return { audienceId, paths, label: def?.label };
}

/**
 * Build pathname + search + hash while preserving (or setting) `?for=`.
 * Omits `for` when it matches the default audience.
 *
 * @param {{ pathname?: string, search?: string, hash?: string } | string} loc
 * @param {{ hash?: string, audienceId?: string | null, defaultAudience?: string }} [opts]
 */
export function buildAppUrl(loc, opts = {}) {
  const url =
    typeof loc === 'string'
      ? new URL(loc, 'https://example.invalid')
      : new URL(
          `${loc.pathname || '/'}${loc.search || ''}${loc.hash || ''}`,
          'https://example.invalid'
        );

  if (opts.hash != null) {
    const nextHash = opts.hash.startsWith('#') ? opts.hash : `#${opts.hash}`;
    // URL serializes a lone `#` as empty; keep `#` so hash routing stays explicit.
    if (nextHash === '#' || nextHash === '') {
      if (opts.audienceId !== undefined) {
        const id = opts.audienceId != null ? String(opts.audienceId).trim().toLowerCase() : '';
        const fallback = opts.defaultAudience || 'default';
        if (!id || id === fallback) url.searchParams.delete('for');
        else url.searchParams.set('for', id);
      }
      return `${url.pathname}${url.search}#`;
    }
    url.hash = nextHash;
  }

  if (opts.audienceId !== undefined) {
    const id = opts.audienceId != null ? String(opts.audienceId).trim().toLowerCase() : '';
    const fallback = opts.defaultAudience || 'default';
    if (!id || id === fallback) {
      url.searchParams.delete('for');
    } else {
      url.searchParams.set('for', id);
    }
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
