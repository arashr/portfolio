/**
 * Ground palette token slugs + JS fallbacks mirroring `assets/css/site/01-tokens.css`.
 * Config `grounds.*` references these slugs instead of raw hex.
 */

/** @type {Record<string, string>} */
export const GROUND_COLOR_DEFAULTS = {
  'ground-pink': '#e6c0d6',
  'ground-white': '#e7e7eb',
  'ground-lime': '#cfec74',
  'ground-tangerine': '#ffc850',
  'ground-lilac': '#d5d0ef',
  'ground-butter': '#fae44f',
  'ground-mint': '#a7dbce',
  'ground-carmine': '#b52840',
  'ground-forest': '#b8d8c5',
  'ground-fg-muted': '#1f2428',
  'ground-fg-ink-deep': '#0c0e10',
  'ground-fg-tangerine-muted': '#2f2114',
  'ground-fg-white-muted': '#4d4f57',
  'ground-fg-carmine-muted': '#f5f7f9',
  'ground-link-hover-text': '#ffffff',
  'ground-pink-display': '#0d0a4f',
  'ground-pink-accent': '#5c1028',
  'ground-white-display': '#2c2781',
  'ground-white-accent': '#b00037',
  'ground-lime-accent': '#2a4508',
  'ground-lilac-display': '#110b84',
  'ground-lilac-accent': '#3d2a9e',
  'ground-butter-accent': '#5f5a00',
  'ground-mint-display': '#0f00b7',
  'ground-mint-accent': '#004535',
  'ground-mint-glyph': '#b5b2d9',
  'ground-forest-display': '#0a3d28',
  'ground-forest-accent': '#0a3d28',
  'ground-carmine-fg': '#ffffff'
};

/** @typedef {import('./gallery-config.js').GroundForeground} GroundForeground */

/** @type {Record<string, GroundForeground>} */
export const GROUND_FOREGROUND_REFS = {
  pink: {
    display: 'ground-pink-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-pink-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  white: {
    display: 'ground-white-display',
    body: 'ink',
    muted: 'ground-fg-white-muted',
    accent: 'ground-white-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  lime: {
    display: 'ground-fg-ink-deep',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-lime-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  tangerine: {
    display: 'ground-fg-ink-deep',
    body: 'ink',
    muted: 'ground-fg-tangerine-muted',
    accent: 'ground-fg-ink-deep',
    focus: 'ground-fg-ink-deep',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  lilac: {
    display: 'ground-lilac-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-lilac-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  butter: {
    display: 'ground-fg-ink-deep',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-butter-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  mint: {
    display: 'ground-mint-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-mint-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  carmine: {
    display: 'ground-carmine-fg',
    body: 'ground-carmine-fg',
    muted: 'ground-fg-carmine-muted',
    accent: 'ground-carmine-fg',
    focus: 'ground-carmine-fg',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  },
  forest: {
    display: 'ground-forest-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-forest-accent',
    focus: 'ground-forest-accent',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ink'
  }
};

/** @param {string} name */
export function groundSurfaceRef(name) {
  return `ground-${name}`;
}

/** @param {string} name */
export function groundForegroundRefs(name) {
  return { ...(GROUND_FOREGROUND_REFS[name] ?? GROUND_FOREGROUND_REFS.pink) };
}
