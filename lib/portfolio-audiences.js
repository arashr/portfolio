import {
  AUDIENCES_CONFIG_PATH,
  applyAudienceToCasePaths,
  buildAppUrl,
  normalizeAudiencesConfig,
  readAudienceIdFromLocation,
  resolveAudienceId
} from './audiences.js';
import { fetchBundledMarkdown } from './bundled-md.js';

/**
 * @param {string} [configPath]
 * @param {string} [baseHref]
 * @param {{ cacheBust?: boolean }} [options]
 */
export async function fetchAudiencesConfig(
  configPath = AUDIENCES_CONFIG_PATH,
  baseHref = globalThis.location?.href,
  options = {}
) {
  try {
    const { text } = await fetchBundledMarkdown(configPath, baseHref, {
      cacheBust: options.cacheBust
    });
    return normalizeAudiencesConfig(JSON.parse(text));
  } catch {
    return normalizeAudiencesConfig(null);
  }
}

/**
 * Active audience from the current URL + config.
 * @param {import('./audiences.js').AudiencesConfig} config
 * @param {{ search?: string } | string | null | undefined} [loc]
 */
export function activeAudienceId(config, loc = globalThis.location) {
  return resolveAudienceId(config, readAudienceIdFromLocation(loc));
}

/**
 * @param {string[]} catalogPaths
 * @param {import('./audiences.js').AudiencesConfig} config
 * @param {{ search?: string } | string | null | undefined} [loc]
 */
export function filterCatalogForLocation(catalogPaths, config, loc = globalThis.location) {
  return applyAudienceToCasePaths(catalogPaths, config, readAudienceIdFromLocation(loc));
}

/**
 * History URL helper that keeps `?for=` in sync with the active audience.
 * @param {import('./audiences.js').AudiencesConfig} config
 * @param {string} hash
 * @param {{ search?: string, pathname?: string } | null} [loc]
 */
export function appUrlForAudience(config, hash, loc = globalThis.location) {
  const audienceId = activeAudienceId(config, loc);
  return buildAppUrl(
    {
      pathname: loc?.pathname ?? globalThis.location?.pathname ?? '/',
      search: loc?.search ?? globalThis.location?.search ?? '',
      hash: globalThis.location?.hash ?? ''
    },
    {
      hash,
      audienceId,
      defaultAudience: config.defaultAudience
    }
  );
}
