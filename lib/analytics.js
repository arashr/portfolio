/**
 * PostHog EU analytics for the portfolio SPA.
 * Loads config from /config/analytics.json (token injected at build / via local override).
 */

import { resolveAnalyticsConfig } from './resolve-analytics-config.js';

const CONFIG_URL = 'config/analytics.json';

/** @type {ReturnType<typeof resolveAnalyticsConfig>['posthog'] | null} */
let cfg = null;
/** @type {boolean} */
let ready = false;
/** @type {Array<[string, Record<string, unknown>]>} */
const queue = [];
/** @type {Set<number>} */
const firedScrollMarks = new Set();
/** @type {string} */
let activeCasePath = '';
/** @type {number} */
let caseOpenedAt = 0;
/** @type {(() => void) | null} */
let scrollDepthTeardown = null;

function dntEnabled() {
  try {
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt === '1' || dnt === 'yes';
  } catch {
    return false;
  }
}

function ph() {
  return typeof window !== 'undefined' ? window.posthog : undefined;
}

function assetsHost(apiHost) {
  return String(apiHost || 'https://eu.i.posthog.com').replace(
    '.i.posthog.com',
    '-assets.i.posthog.com'
  );
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} [props]
 */
export function track(event, props = {}) {
  if (!event) return;
  if (!ready) {
    queue.push([event, props]);
    return;
  }
  if (!cfg?.enabled) return;
  const client = ph();
  if (!client?.capture) return;
  try {
    client.capture(event, props);
  } catch {
    /* ignore analytics failures */
  }
}

/**
 * SPA-friendly pageview (PostHog does not auto-track pushState).
 * @param {string} [path]
 * @param {Record<string, unknown>} [props]
 */
export function trackPageview(path, props = {}) {
  const url = path || `${location.pathname}${location.search}${location.hash}`;
  track('$pageview', { ...props, $current_url: `${location.origin}${url}` });
}

function flushQueue() {
  while (queue.length) {
    const item = queue.shift();
    if (!item) break;
    track(item[0], item[1]);
  }
}

/**
 * Install PostHog stub + load array.js, then init.
 * @param {ReturnType<typeof resolveAnalyticsConfig>['posthog']} posthogCfg
 * @returns {Promise<boolean>}
 */
function loadPosthogSnippet(posthogCfg) {
  return new Promise((resolve) => {
    if (ph()?.__loaded) {
      resolve(true);
      return;
    }

    // Minimal stub so capture calls queue until array.js replaces window.posthog.
    if (!window.posthog || !window.posthog.init) {
      const stub = [];
      stub.__SV = 1;
      stub._i = [];
      stub.people = [];
      stub.toString = function toString(people) {
        return people ? 'posthog.people (stub)' : 'posthog (stub)';
      };
      stub.people.toString = function peopleToString() {
        return stub.toString(1);
      };
      stub.init = function init(token, config) {
        stub._i.push([token, config, 'posthog']);
      };
      const methods = [
        'capture',
        'identify',
        'group',
        'reset',
        'register',
        'register_once',
        'unregister',
        'opt_out_capturing',
        'has_opted_out_capturing',
        'opt_in_capturing',
        'get_distinct_id',
        'get_feature_flag',
        'isFeatureEnabled',
        'reloadFeatureFlags'
      ];
      for (const method of methods) {
        stub[method] = function queuedMethod() {
          stub.push([method].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }
      window.posthog = stub;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `${assetsHost(posthogCfg.apiHost)}/static/array.js`;
    script.onerror = () => {
      console.warn('[analytics] Failed to load PostHog array.js');
      resolve(false);
    };
    script.onload = () => {
      try {
        /** @type {Record<string, unknown>} */
        const initOpts = {
          api_host: posthogCfg.apiHost,
          ui_host: posthogCfg.uiHost,
          capture_pageview: false,
          capture_pageleave: posthogCfg.capturePageleaves,
          autocapture: posthogCfg.autocapture,
          disable_session_recording: !posthogCfg.sessionRecording,
          person_profiles: posthogCfg.personProfiles,
          loaded: () => resolve(true)
        };
        if (posthogCfg.cookielessMode) {
          initOpts.cookieless_mode = posthogCfg.cookielessMode;
        } else {
          initOpts.persistence = posthogCfg.persistence;
        }
        window.posthog.init(posthogCfg.projectToken, initOpts);
        // array.js may not call `loaded` in every build — don't hang forever
        window.setTimeout(() => resolve(Boolean(ph()?.capture || ph()?.__loaded)), 2000);
      } catch (err) {
        console.warn('[analytics] PostHog init failed', err);
        resolve(false);
      }
    };
    document.head.appendChild(script);
  });
}

function teardownScrollDepth() {
  scrollDepthTeardown?.();
  scrollDepthTeardown = null;
  firedScrollMarks.clear();
}

/**
 * Track scroll depth for landing or a case study.
 * @param {string} pagePath use `'landing'` on the homepage, else the case study path
 * @param {number[]} marks
 */
export function startCaseReadingSession(pagePath, marks = cfg?.scrollDepthMarks || []) {
  teardownScrollDepth();
  activeCasePath = pagePath;
  caseOpenedAt = Date.now();
  if (!cfg?.enabled || !marks.length) return;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    for (const mark of marks) {
      if (pct < mark || firedScrollMarks.has(mark)) continue;
      firedScrollMarks.add(mark);
      const isLanding = activeCasePath === 'landing';
      track('scroll_depth', {
        page: activeCasePath,
        page_type: isLanding ? 'landing' : 'case',
        case_path: isLanding ? undefined : activeCasePath,
        depth: mark,
        audience: document.documentElement.dataset.audience || undefined
      });
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  scrollDepthTeardown = () => window.removeEventListener('scroll', onScroll);
  onScroll();
}

/**
 * @param {Record<string, unknown>} [extra]
 */
export function endCaseReadingSession(extra = {}) {
  if (activeCasePath && caseOpenedAt) {
    const isLanding = activeCasePath === 'landing';
    track('page_leave', {
      page: activeCasePath,
      page_type: isLanding ? 'landing' : 'case',
      case_path: isLanding ? undefined : activeCasePath,
      duration_ms: Math.max(0, Date.now() - caseOpenedAt),
      max_scroll_depth: firedScrollMarks.size
        ? Math.max(0, ...firedScrollMarks)
        : 0,
      audience: document.documentElement.dataset.audience || undefined,
      ...extra
    });
    // Keep legacy name for case studies so existing PostHog insights keep working.
    if (!isLanding) {
      track('case_study_leave', {
        case_path: activeCasePath,
        duration_ms: Math.max(0, Date.now() - caseOpenedAt),
        max_scroll_depth: firedScrollMarks.size
          ? Math.max(0, ...firedScrollMarks)
          : 0,
        audience: document.documentElement.dataset.audience || undefined,
        ...extra
      });
    }
  }
  teardownScrollDepth();
  activeCasePath = '';
  caseOpenedAt = 0;
}

/**
 * @param {{ fetchConfig?: () => Promise<unknown> }} [options]
 */
export async function initAnalytics(options = {}) {
  if (ready) return cfg;

  let raw = {};
  let localPatch = {};
  try {
    if (options.fetchConfig) {
      raw = (await options.fetchConfig()) || {};
    } else {
      const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
      if (res.ok) raw = await res.json();
      // Dev-only override — never request this on production (404 noise).
      const host = location.hostname;
      const isLocalHost =
        host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
      if (isLocalHost) {
        try {
          const localRes = await fetch('config/analytics.local.json', { cache: 'no-cache' });
          if (localRes.ok) localPatch = await localRes.json();
        } catch {
          /* optional */
        }
      }
    }
  } catch {
    raw = {};
  }

  const resolved = resolveAnalyticsConfig(raw, localPatch, {});
  cfg = resolved.posthog;

  if (!cfg.enabled) {
    console.info('[analytics] disabled (no project token or enabled:false)');
    ready = true;
    queue.length = 0;
    return cfg;
  }

  if (cfg.respectDnt && dntEnabled()) {
    console.info('[analytics] skipped — Do Not Track is on (set respectDnt:false to override)');
    cfg = { ...cfg, enabled: false };
    ready = true;
    queue.length = 0;
    return cfg;
  }

  const ok = await loadPosthogSnippet(cfg);
  ready = true;
  if (!ok) {
    console.warn('[analytics] PostHog did not load');
    cfg = { ...cfg, enabled: false };
    queue.length = 0;
    return cfg;
  }

  console.info('[analytics] PostHog ready', cfg.apiHost);
  flushQueue();
  if (cfg.capturePageviews) {
    trackPageview();
  }
  return cfg;
}

export function getAnalyticsConfig() {
  return cfg;
}
