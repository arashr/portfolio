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
  'ground-green': '#09b557',
  'ground-indigo': '#2c2781',
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
  'ground-lime-display': '#0c0e10',
  'ground-lime-accent': '#2a5c5c',
  'ground-tangerine-display': '#0c0e10',
  'ground-tangerine-accent': '#2f2114',
  'ground-lilac-display': '#110b84',
  'ground-lilac-accent': '#3d2a9e',
  'ground-butter-display': '#0c0e10',
  'ground-butter-accent': '#a83800',
  'ground-butter-toc-hover-text': '#a83800',
  'ground-mint-display': '#0f00b7',
  'ground-mint-accent': '#004535',
  'ground-mint-glyph': '#b5b2d9',
  'ground-carmine-fg': '#ffffff',
  'ground-carmine-display': '#ffffff',
  'ground-forest-display': '#0a3d28',
  'ground-forest-accent': '#0f5c3a',
  'ground-green-display': '#053318',
  'ground-green-accent': '#0a4528',
  'ground-indigo-fg': '#ffffff',
  'ground-indigo-muted': '#c8c6e4',
  'ground-indigo-accent': '#fae44f',
  'ground-indigo-display': '#ffffff',
  'ground-indigo-link-hover-text': '#2c2781',
  'ground-indigo-toc-hover-text': '#fae44f',
  'ground-carmine-link-hover-text': '#b52840'
};

/** @typedef {import('./gallery-config.js').GroundForeground} GroundForeground */

/** Stable poster-ground rotation order (fixed slots — new grounds only claim inactive slots). */
export const GROUND_CANONICAL_ORDER = [
  'pink',
  'white',
  'lime',
  'tangerine',
  'lilac',
  'butter',
  'mint',
  'carmine',
  'forest',
  'green',
  'indigo'
];

/** @type {Record<string, GroundForeground>} */
export const GROUND_FOREGROUND_REFS = {
  pink: {
    display: 'ground-pink-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-pink-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-pink-display'
  },
  white: {
    display: 'ground-white-display',
    body: 'ink',
    muted: 'ground-fg-white-muted',
    accent: 'ground-white-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-white-display'
  },
  lime: {
    display: 'ground-lime-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-lime-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-lime-display'
  },
  tangerine: {
    display: 'ground-tangerine-display',
    body: 'ink',
    muted: 'ground-fg-tangerine-muted',
    accent: 'ground-tangerine-accent',
    focus: 'ground-tangerine-display',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-tangerine-accent'
  },
  lilac: {
    display: 'ground-lilac-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-lilac-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-lilac-display'
  },
  butter: {
    display: 'ground-butter-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-butter-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-butter-accent'
  },
  mint: {
    display: 'ground-mint-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-mint-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-mint-accent'
  },
  carmine: {
    display: 'ground-carmine-display',
    body: 'ground-carmine-fg',
    muted: 'ground-fg-carmine-muted',
    accent: 'ground-carmine-fg',
    focus: 'ground-carmine-fg',
    linkHoverText: 'ground-carmine-link-hover-text',
    linkHoverBg: 'paper'
  },
  forest: {
    display: 'ground-forest-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-forest-accent',
    focus: 'ground-forest-accent',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-forest-display'
  },
  green: {
    display: 'ground-green-display',
    body: 'ink',
    muted: 'ground-fg-muted',
    accent: 'ground-green-accent',
    focus: 'ink',
    linkHoverText: 'ground-link-hover-text',
    linkHoverBg: 'ground-green-display'
  },
  indigo: {
    display: 'ground-indigo-display',
    body: 'ground-indigo-fg',
    muted: 'ground-indigo-muted',
    accent: 'ground-indigo-accent',
    focus: 'ground-indigo-fg',
    linkHoverText: 'ground-indigo-link-hover-text',
    linkHoverBg: 'paper'
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
