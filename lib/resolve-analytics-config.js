/**
 * Resolve public PostHog settings for build / tests.
 * Project tokens (phc_) are write-only; personal keys must never appear here.
 */

/** @typedef {{
 *   enabled?: boolean,
 *   projectToken?: string,
 *   apiHost?: string,
 *   uiHost?: string,
 *   capturePageviews?: boolean,
 *   capturePageleaves?: boolean,
 *   autocapture?: boolean,
 *   sessionRecording?: boolean,
 *   persistence?: string,
 *   cookielessMode?: '' | 'always' | 'on_reject',
 *   personProfiles?: 'always' | 'never' | 'identified_only',
 *   respectDnt?: boolean,
 *   scrollDepthMarks?: number[]
 * }} PosthogAnalyticsConfig */

/** @typedef {{ posthog?: PosthogAnalyticsConfig }} AnalyticsConfig */

export const ANALYTICS_DEFAULTS = {
  enabled: false,
  projectToken: '',
  apiHost: 'https://eu.i.posthog.com',
  uiHost: 'https://eu.posthog.com',
  capturePageviews: true,
  capturePageleaves: true,
  autocapture: false,
  sessionRecording: false,
  /** Unused when cookielessMode is set. */
  persistence: 'memory',
  /**
   * EU-friendly default: no cookies / localStorage from PostHog.
   * Enable “Cookieless server hash mode” in PostHog project settings.
   * Use "" / omit only if you add a consent banner + opt-in.
   */
  cookielessMode: 'always',
  personProfiles: 'never',
  respectDnt: true,
  scrollDepthMarks: [25, 50, 75, 100]
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function asBool(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
  }
  return fallback;
}

/**
 * Drop anything that looks like a personal/private PostHog credential.
 * @param {string} token
 */
export function sanitizeProjectToken(token) {
  const t = String(token || '').trim();
  if (!t) return '';
  // Personal API keys and other private credentials — never ship these.
  if (/^phx_/i.test(t) || /^phs_/i.test(t) || /^phr_/i.test(t)) return '';
  if (!/^phc_/i.test(t)) return '';
  return t;
}

/**
 * @param {AnalyticsConfig | undefined} base
 * @param {AnalyticsConfig | undefined} patch
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ posthog: Required<PosthogAnalyticsConfig> }}
 */
export function resolveAnalyticsConfig(base = {}, patch = {}, env = {}) {
  const merged = {
    ...ANALYTICS_DEFAULTS,
    ...(base.posthog && typeof base.posthog === 'object' ? base.posthog : {}),
    ...(patch.posthog && typeof patch.posthog === 'object' ? patch.posthog : {})
  };

  const envToken = sanitizeProjectToken(env.POSTHOG_PROJECT_TOKEN || '');
  if (envToken) merged.projectToken = envToken;

  if (env.POSTHOG_ENABLED != null && String(env.POSTHOG_ENABLED).trim() !== '') {
    merged.enabled = asBool(env.POSTHOG_ENABLED, merged.enabled);
  }

  const projectToken = sanitizeProjectToken(merged.projectToken);
  const marks = Array.isArray(merged.scrollDepthMarks)
    ? merged.scrollDepthMarks
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
    : [...ANALYTICS_DEFAULTS.scrollDepthMarks];

  const cookielessRaw = String(merged.cookielessMode ?? ANALYTICS_DEFAULTS.cookielessMode).trim();
  const cookielessMode =
    cookielessRaw === 'always' || cookielessRaw === 'on_reject' ? cookielessRaw : '';

  const personProfilesRaw = String(
    merged.personProfiles || ANALYTICS_DEFAULTS.personProfiles
  ).trim();
  const personProfiles =
    personProfilesRaw === 'always' ||
    personProfilesRaw === 'never' ||
    personProfilesRaw === 'identified_only'
      ? personProfilesRaw
      : ANALYTICS_DEFAULTS.personProfiles;

  const enabled = asBool(merged.enabled, false) && Boolean(projectToken);

  return {
    posthog: {
      enabled,
      projectToken,
      apiHost: String(merged.apiHost || ANALYTICS_DEFAULTS.apiHost),
      uiHost: String(merged.uiHost || ANALYTICS_DEFAULTS.uiHost),
      capturePageviews: asBool(merged.capturePageviews, true),
      capturePageleaves: asBool(merged.capturePageleaves, true),
      autocapture: asBool(merged.autocapture, false),
      sessionRecording: asBool(merged.sessionRecording, false),
      persistence: String(merged.persistence || ANALYTICS_DEFAULTS.persistence),
      cookielessMode,
      personProfiles,
      respectDnt: asBool(merged.respectDnt, true),
      scrollDepthMarks: marks.length ? marks : [...ANALYTICS_DEFAULTS.scrollDepthMarks]
    }
  };
}
