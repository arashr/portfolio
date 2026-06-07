import { TYPE_PATTERN_DEFAULTS } from './type-pattern-poster.js';
import { IMAGE_HALFTONE_DEFAULTS } from './image-halftone-config.js';
import { IMAGE_ISO_DEFAULTS } from './image-iso-config.js';
import { HERO_GLYPH_DEFAULTS } from './poster-hero-glyph.js';
import { resolveGlyphPatternTokens } from './resolve-graphics-config.js';
import { resolveImageIsometricOptions, imageIsometricCssVars } from './image-iso-config.js';

/** @typedef {{ id: string, google: string, lineHeight?: string, headingLineHeight?: string, letterSpacing?: string }} TitleFaceConfig */
/** @typedef {{ display?: string, body?: string, muted?: string, accent?: string, focus?: string, linkHoverText?: string, linkHoverBg?: string }} GroundForeground */
/** @typedef {{ surface: string, foreground?: GroundForeground, codeChipPaperMix?: string }} GroundDef */
/** @typedef {string | GroundDef} GroundEntry */

const DEFAULT_GROUND_FOREGROUND = {
  light: {
    display: '#710617',
    body: 'ink',
    muted: '#1f2428',
    accent: '#710617',
    focus: 'ink',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  },
  tangerine: {
    display: '#710617',
    body: 'ink',
    muted: '#1f2428',
    accent: '#710617',
    focus: '#710617',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  },
  forest: {
    display: '#0a3d28',
    body: 'ink',
    muted: '#1f2428',
    accent: '#0a3d28',
    focus: '#0a3d28',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  },
  carmine: {
    display: '#ffffff',
    body: '#ffffff',
    muted: '#f5f7f9',
    accent: '#ffffff',
    focus: '#ffffff',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  }
};

const DEFAULT_CONFIG = {
  theme: {
    colors: {
      paper: '#eff1f3',
      ink: '#0c0e10',
      inkSoft: '#1b1f24',
      inkMute: 'rgba(12, 14, 16, 0.66)',
      red: '#c8102e',
      redBright: '#e8334e'
    },
    layout: {
      measure: '65ch',
      posterWidth: '42rem',
      edgeStepMix: 0.12,
      pad: 'clamp(16px, 4vw, 56px)',
      scrollOffset: '6.5rem'
    },
    hero: {
      display: 'red',
      body: 'inkSoft',
      muted: 'inkMute'
    },
    typography: {
      bodySize: '17px',
      bodyLineHeight: '1.5',
      proseLineHeight: '1.6',
      titleLineHeight: '1.12',
      titleHeadingLineHeight: '0.95',
      titleFaceLetterSpacing: '0.02em',
      labelSize: '0.75rem',
      labelWeight: '500',
      labelLetterSpacing: '0.06em',
      proseSize: '18px',
      crumbSize: '0.85rem'
    },
    motion: {
      cardHoverEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
      cardHoverDuration: '0.4s',
      revealDuration: '0.8s',
      revealEase: 'ease',
      shutterDuration: '0.9s',
      shutterEase: 'cubic-bezier(0.77, 0, 0.18, 1)'
    },
    edgeHalftone: {
      enabled: false,
      heightPx: 96,
      dotPx: 6,
      angleDeg: 15,
      pattern: 'stagger',
      contrast: 1.15,
      fadePower: 1.45,
      pushPx: 0,
      mergeDotScale: 0.72,
      showOnHome: false,
      color: 'paper'
    },
    graphics: {
      glyphPatternColor: 'display',
      glyphPatternOpacity: 0.07,
      imageHalftone: { ...IMAGE_HALFTONE_DEFAULTS },
      imageIsometric: { ...IMAGE_ISO_DEFAULTS },
      heroGlyph: { ...HERO_GLYPH_DEFAULTS },
      typePattern: { ...TYPE_PATTERN_DEFAULTS }
    },
    code: {
      text: 'paper',
      blockSteps: 1,
      blockStepMix: 0.02,
      referenceSteps: 1,
      autoCompensateMix: false,
      inlineSurfaceMix: '45%',
      chipDarkBodyLift: '20%',
      chipLightSurfaceShade: '10%'
    }
  },
  darkTheme: {
    paper: '#12151a',
    colors: {
      ink: '#eef0f4',
      inkSoft: '#c8cdd6',
      inkMute: '#c0c8d4',
      red: '#ffa0ab',
      redBright: '#ffb3bc'
    },
    dropZone: {
      butterMix: '22%'
    }
  },
  grounds: {
    pink: {
      surface: '#f8c0d4',
      foreground: DEFAULT_GROUND_FOREGROUND.light
    },
    lime: {
      surface: '#e0ff83',
      foreground: DEFAULT_GROUND_FOREGROUND.light
    },
    tangerine: {
      surface: '#fbc090',
      foreground: DEFAULT_GROUND_FOREGROUND.tangerine
    },
    lilac: {
      surface: '#d5d0ef',
      foreground: DEFAULT_GROUND_FOREGROUND.light
    },
    forest: {
      surface: '#b8d8c5',
      foreground: DEFAULT_GROUND_FOREGROUND.forest
    },
    butter: {
      surface: '#ffc64d',
      foreground: DEFAULT_GROUND_FOREGROUND.light
    },
    mint: {
      surface: '#a7dbce',
      foreground: DEFAULT_GROUND_FOREGROUND.light
    },
    carmine: {
      surface: '#b52840',
      foreground: DEFAULT_GROUND_FOREGROUND.carmine
    }
  },
  fonts: {
    uiSans: {
      family: 'Inconsolata',
      google: 'Inconsolata:ital,wght@0,500;0,700;0,900;1,400'
    },
    uiSerif: {
      family: 'Libre Baskerville',
      google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400'
    },
    mono: {
      family: 'Inconsolata',
      google: 'Inconsolata:ital,wght@0,500;0,700;0,900;1,400',
      lineHeight: '1.45'
    },
    titleFaces: [
      { id: 'ultra', google: 'Ultra', letterSpacing: '-0.005em' },
      { id: 'monoton', google: 'Rubik+Dirt', lineHeight: '0.88', letterSpacing: '0.04em' },
      { id: 'limelight', google: 'BBH+Bogle', letterSpacing: '0.01em' },
      { id: 'jersey25', google: 'Jersey+25', lineHeight: '0.88', letterSpacing: '0.03em' },
      { id: 'blackops', google: 'Black+Ops+One', lineHeight: '0.86', letterSpacing: '0.02em' },
      { id: 'notable', google: 'Notable', lineHeight: '0.9', letterSpacing: '0.01em' },
      { id: 'calsans', google: 'Cal+Sans', lineHeight: '0.95', letterSpacing: '-0.01em' }
    ]
  },
  titleScale: {
    minPx: 64,
    maxPx: 280,
    maxWidthRatio: 0.45,
    floorPx: 14,
    slackMinPx: 56,
    bAspect: 353 / 250,
    tiers: [
      { maxChars: 18 },
      { maxChars: 42, maxWidthRatio: 0.34, minPx: 36, maxPx: 120, maxLines: 4 },
      {
        maxChars: null,
        maxWidthRatio: 0.26,
        minPx: 20,
        maxPx: 80,
        maxLines: 3,
        maxPxRatio: 0.72,
        floorPx: 14
      }
    ]
  }
};

let activeConfig = structuredClone(DEFAULT_CONFIG);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeConfig(base, patch) {
  if (!isPlainObject(patch)) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const next = patch[key];
    // Grounds should be replaceable as a full map so removing an entry
    // from config actually removes it from the active palette.
    if (key === 'grounds' && isPlainObject(next)) {
      out[key] = structuredClone(next);
      continue;
    }
    if (Array.isArray(next)) {
      out[key] = next.slice();
    } else if (isPlainObject(next) && isPlainObject(base[key])) {
      out[key] = mergeConfig(base[key], next);
    } else if (next !== undefined) {
      out[key] = next;
    }
  }
  return out;
}

/** @param {GroundEntry} entry */
function defaultForegroundForGround(name) {
  if (name === 'tangerine') return DEFAULT_GROUND_FOREGROUND.tangerine;
  if (name === 'forest') return DEFAULT_GROUND_FOREGROUND.forest;
  if (name === 'carmine') return DEFAULT_GROUND_FOREGROUND.carmine;
  return DEFAULT_GROUND_FOREGROUND.light;
}

export function normalizeGround(entry, name) {
  if (typeof entry === 'string') {
    return {
      surface: entry,
      foreground: { ...defaultForegroundForGround(name) }
    };
  }
  const fg = { ...defaultForegroundForGround(name), ...(entry.foreground || {}) };
  const out = {
    surface: entry.surface,
    foreground: fg
  };
  if (entry.codeChipPaperMix != null) out.codeChipPaperMix = entry.codeChipPaperMix;
  return out;
}

/** @returns {Record<string, GroundDef>} */
export function getGroundDefs(cfg = activeConfig) {
  const out = {};
  for (const [name, entry] of Object.entries(cfg.grounds || {})) {
    out[name] = normalizeGround(entry, name);
  }
  return out;
}

function themeColors(cfg) {
  const t = cfg.theme || {};
  const c = t.colors || {};
  return {
    paper: c.paper ?? t.paper ?? DEFAULT_CONFIG.theme.colors.paper,
    ink: c.ink ?? t.ink ?? DEFAULT_CONFIG.theme.colors.ink,
    inkSoft: c.inkSoft ?? t.inkSoft ?? DEFAULT_CONFIG.theme.colors.inkSoft,
    inkMute: c.inkMute ?? t.inkMute ?? DEFAULT_CONFIG.theme.colors.inkMute,
    red: c.red ?? t.red ?? DEFAULT_CONFIG.theme.colors.red,
    redBright: c.redBright ?? t.redBright ?? DEFAULT_CONFIG.theme.colors.redBright
  };
}

/** Resolve semantic token (e.g. "red", "inkSoft") or pass through hex/rgba. */
export function resolveColor(value, cfg = activeConfig) {
  if (value == null || value === '') return value;
  const s = String(value).trim();
  if (s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') || s === 'var(--hair)') {
    return s;
  }
  const colors = themeColors(cfg);
  const map = {
    paper: colors.paper,
    ink: colors.ink,
    inkSoft: colors.inkSoft,
    inkMute: colors.inkMute,
    red: colors.red,
    redBright: colors.redBright
  };
  return map[s] ?? s;
}

export function getGalleryConfig() {
  return activeConfig;
}

export function setGalleryConfig(partial) {
  activeConfig = mergeConfig(structuredClone(DEFAULT_CONFIG), partial || {});
  return activeConfig;
}

export async function loadGalleryConfig(url = 'config/gallery.config.json') {
  try {
    const bust = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
    const res = await fetch(bust, { cache: 'no-store' });
    if (!res.ok) return activeConfig;
    const json = await res.json();
    return setGalleryConfig(json);
  } catch {
    return activeConfig;
  }
}

export async function reloadGalleryConfig(url = 'config/gallery.config.json') {
  const cfg = await loadGalleryConfig(url);
  applyGalleryConfigToDocument(cfg);
  return cfg;
}

export function fontsHrefFromConfig(cfg = activeConfig) {
  const { fonts } = cfg;
  const families = [
    fonts.uiSans.google,
    fonts.uiSerif.google,
    fonts.mono.google,
    ...fonts.titleFaces.map((f) => f.google)
  ];
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}

export function buildGroundStylesheet(cfg) {
  const defs = getGroundDefs(cfg);
  const glyphTokens = resolveGlyphPatternTokens(cfg);
  const glyphOpacity = glyphTokens.opacity;
  const glyphColorKey = glyphTokens.color;
  const lines = [];

  for (const [name, def] of Object.entries(defs)) {
    const fg = def.foreground;
    const glyphColor =
      glyphColorKey === 'display'
        ? resolveColor(fg.display, cfg)
        : resolveColor(glyphColorKey, cfg);
    lines.push(
      `.ground-${name}{background:var(--ground-${name});--surface:var(--ground-${name});` +
        `--on-ground-display:${resolveColor(fg.display, cfg)};` +
        `--on-ground-body:${resolveColor(fg.body, cfg)};` +
        `--on-ground-muted:${resolveColor(fg.muted, cfg)};` +
        `--on-ground-accent:${resolveColor(fg.accent, cfg)};` +
        `--on-ground-focus:${resolveColor(fg.focus, cfg)};` +
        `--on-ground-glyph-pattern-color:${glyphColor};` +
        `--on-ground-glyph-pattern-opacity:${glyphOpacity};` +
        `--on-ground-link-hover-text:${resolveColor(fg.linkHoverText ?? '#ffffff', cfg)};` +
        `--on-ground-link-hover-bg:${resolveColor(fg.linkHoverBg ?? 'ink', cfg)};}`
    );
  }

  return lines.join('\n');
}

function clampMix(value, max = 0.65) {
  return Math.min(max, Math.max(0.04, Number(value) || 0.12));
}

function clampCodeSteps(value) {
  return Math.max(1, Math.min(4, Number(value) || 2));
}

/**
 * Per-step OKLCH mix toward black. When autoCompensateMix is true (default),
 * blockStepMix + referenceSteps define target darkness; mix scales with blockSteps
 * so 1 step at ~0.59 ≈ 2 steps at 0.36.
 */
export function resolveCodeStepMix(cfg = activeConfig) {
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const layout = { ...DEFAULT_CONFIG.theme.layout, ...(cfg.theme?.layout || {}) };
  const edgeMix = clampMix(layout.edgeStepMix ?? 0.12);
  const steps = clampCodeSteps(code.blockSteps);

  if (code.autoCompensateMix === false) {
    return clampMix(code.blockStepMix ?? edgeMix);
  }

  const refSteps = clampCodeSteps(code.referenceSteps ?? 2);
  const refMix = clampMix(code.blockStepMix ?? 0.36);
  const retention = Math.pow(1 - refMix, refSteps);
  return clampMix(1 - Math.pow(retention, 1 / steps));
}

export function resolveCodeBlockSteps(cfg = activeConfig) {
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  return clampCodeSteps(code.blockSteps);
}

/** @param {string} base CSS color expression, e.g. `var(--surface)` */
export function codeBlockBgMixExpr(base, steps = 2, mixVar = 'var(--code-step-mix)') {
  const n = Math.max(1, Math.min(4, Number(steps) || 2));
  let expr = base;
  for (let i = 0; i < n; i++) {
    expr = `color-mix(in oklch, ${expr} calc(100% - ${mixVar}), black)`;
  }
  return expr;
}

function parseHexRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Conservative sRGB mix for APCA tests (OKLCH in CSS is the source of truth). */
export function codeBlockBgFromSurface(surface, cfg = activeConfig) {
  const blockMix = resolveCodeStepMix(cfg);
  const steps = resolveCodeBlockSteps(cfg);
  let rgb = parseHexRgb(resolveColor(surface, cfg));
  for (let i = 0; i < steps; i++) {
    rgb = rgb.map((c) => Math.round(c * (1 - blockMix)));
  }
  return rgbToHex(rgb);
}

function parsePercent(value) {
  const raw = String(value ?? '').replace('%', '').trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n / 100));
}

function srgbRelativeLuminance([r, g, b]) {
  const channel = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Dark poster/page body (e.g. ink) — code chips get an extra lift toward paper for APCA. */
export function isDarkForegroundColor(color, cfg = activeConfig) {
  const hex = resolveColor(color, cfg);
  if (!hex.startsWith('#')) return true;
  return srgbRelativeLuminance(parseHexRgb(hex)) < 0.5;
}

/** White ground ≈ page paper; carmine uses light body — code chips darken instead of lift. */
export function shouldDarkenCodeChip(groundName, groundDef, cfg = activeConfig) {
  if (groundName === 'white') return true;
  const body = groundDef?.foreground?.body ?? 'ink';
  return !isDarkForegroundColor(body, cfg);
}

/**
 * Code chip background (hex, for APCA + export). Dark ink body: lighter than ground.
 * White / carmine: darker than ground.
 */
export function codeChipBgFromSurface(
  surface,
  cfg = activeConfig,
  groundDef = null,
  groundName = ''
) {
  const surfaceHex = resolveColor(surface, cfg);
  const paperHex = resolveColor('paper', cfg);
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };

  if (shouldDarkenCodeChip(groundName, groundDef, cfg)) {
    const shade = parsePercent(code.chipLightSurfaceShade ?? '10%');
    return mixHexRgb(surfaceHex, '#000000', shade);
  }

  const lift = parsePercent(code.chipDarkBodyLift ?? '20%');
  let chip = mixHexRgb(surfaceHex, paperHex, lift);
  const paperMixRaw = groundDef?.codeChipPaperMix ?? code.chipPaperMix;
  if (paperMixRaw != null && paperMixRaw !== '') {
    chip = mixHexRgb(chip, paperHex, parsePercent(paperMixRaw));
  }
  return chip;
}

/** OKLCH: lift chip toward light paper (fixed; not `var(--paper)` — that flips in dark mode). */
export function codeChipBgMixExpr(surfaceVar = 'var(--surface)', liftPct = 20) {
  const towardSurface = Math.min(100, Math.max(0, 100 - liftPct));
  return `color-mix(in oklch, ${surfaceVar} ${towardSurface}%, var(--config-paper))`;
}

/** OKLCH: shade chip toward black (white ground, carmine, page paper). */
export function codeChipShadeMixExpr(surfaceVar = 'var(--surface)', shadePct = 10) {
  const towardSurface = Math.min(100, Math.max(0, 100 - shadePct));
  return `color-mix(in oklch, ${surfaceVar} ${towardSurface}%, black)`;
}

export function buildCodeStylesheet(cfg) {
  const steps = resolveCodeBlockSteps(cfg);
  const groundBg = codeBlockBgMixExpr('var(--surface)', steps);
  const pageBg = codeBlockBgMixExpr('var(--paper)', steps);
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const darkLiftPct = Math.round(parsePercent(code.chipDarkBodyLift ?? '20%') * 100);
  const lightShadePct = Math.round(parsePercent(code.chipLightSurfaceShade ?? '10%') * 100);
  const pageChip = codeChipShadeMixExpr('var(--paper)', lightShadePct);
  const lines = [
    `[class*='ground-']{--on-ground-code-bg:${groundBg};}`,
    `:root{--code-block-bg:${pageBg};--code-chip-bg:${pageChip};}`,
    `[class*='ground-'] .prose pre{--code-block-bg:var(--on-ground-code-bg);}`
  ];

  for (const [name, def] of Object.entries(getGroundDefs(cfg))) {
    const chip = shouldDarkenCodeChip(name, def, cfg)
      ? codeChipShadeMixExpr('var(--surface)', lightShadePct)
      : codeChipBgMixExpr('var(--surface)', darkLiftPct);
    lines.push(`.ground-${name}{--on-ground-code-chip-bg:${chip};}`);
  }

  return lines.join('\n');
}

function mixHexRgb(a, b, amountOfB) {
  const pa = parseHexRgb(a);
  const pb = parseHexRgb(b);
  const t = Math.min(1, Math.max(0, amountOfB));
  const rgb = pa.map((c, i) => Math.round(c * (1 - t) + pb[i] * t));
  return rgbToHex(rgb);
}

/** OKLCH-free code styles for html2canvas PDF export. */
export function buildCodeStylesheetForExport(cfg = activeConfig) {
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const steps = resolveCodeBlockSteps(cfg);
  const inlineMixRaw = String(code.inlineSurfaceMix ?? '35%').replace('%', '').trim();
  const inlineTowardSurface = Math.min(1, Math.max(0, parseFloat(inlineMixRaw) / 100));
  const pageSurface = resolveColor('paper', cfg);
  const pageCodeBg = codeBlockBgFromSurface(pageSurface, cfg);
  const lines = [`:root{--code-block-bg:${pageCodeBg};}`];

  for (const [name, def] of Object.entries(getGroundDefs(cfg))) {
    const surface = resolveColor(def.surface, cfg);
    const codeBg = codeBlockBgFromSurface(surface, cfg);
    const chipBg = codeChipBgFromSurface(def.surface, cfg, def, name);
    lines.push(
      `.ground-${name}{--on-ground-code-bg:${codeBg};--on-ground-code-chip-bg:${chipBg};}`,
      `.ground-${name} .prose pre{--code-block-bg:var(--on-ground-code-bg);background:${surface};}`,
      `.ground-${name} .prose .table-wrap,.ground-${name} .prose table,.ground-${name} .prose th,.ground-${name} .prose td{background:${surface};}`,
      `.post-card.ground-${name} .prose :not(pre)>code{background:${chipBg};}`
    );
  }

  return lines.join('\n');
}

/** Hex-only :root tokens for export (avoids unresolved custom properties in the clone). */
export function buildExportRootVars(cfg = activeConfig) {
  const colors = themeColors(cfg);
  const hero = { ...DEFAULT_CONFIG.theme.hero, ...(cfg.theme?.hero || {}) };
  const layout = { ...DEFAULT_CONFIG.theme.layout, ...(cfg.theme?.layout || {}) };
  const graphics = { ...DEFAULT_CONFIG.theme.graphics, ...(cfg.theme?.graphics || {}) };
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const edgeMix = Math.min(0.4, Math.max(0.04, Number(layout.edgeStepMix) || 0.12));
  const blockMix = resolveCodeStepMix(cfg);
  const glyphTokens = resolveGlyphPatternTokens(cfg);
  const glyphOpacity = glyphTokens.opacity;
  const glyphColor =
    glyphTokens.color === 'display'
      ? resolveColor(hero.display, cfg)
      : resolveColor(glyphTokens.color, cfg);
  const groundVars = Object.entries(getGroundDefs(cfg))
    .map(([name, def]) => `--ground-${name}:${resolveColor(def.surface, cfg)}`)
    .join(';');

  return (
    `:root{` +
    `--config-paper:${colors.paper};` +
    `--config-ink:${colors.ink};` +
    `--config-ink-soft:${colors.inkSoft};` +
    `--config-ink-mute:${colors.inkMute};` +
    `--config-edge-mix:${Math.round(edgeMix * 100)}%;` +
    `--config-glyph-pattern-color:${glyphColor};` +
    `--config-glyph-pattern-opacity:${glyphOpacity};` +
    `--config-code-text:${resolveColor(code.text ?? 'paper', cfg)};` +
    `--config-code-inline-mix:${code.inlineSurfaceMix ?? '35%'};` +
    `--config-code-block-step-mix:${Math.round(blockMix * 100)}%;` +
    `--paper:${colors.paper};` +
    `--ink:${colors.ink};` +
    `--edge-mix:${Math.round(edgeMix * 100)}%;` +
    `${groundVars};` +
    `}`
  );
}

function ensureGroundStyleEl() {
  let el = document.getElementById('gallery-config-grounds');
  if (!el) {
    el = document.createElement('style');
    el.id = 'gallery-config-grounds';
    document.head.appendChild(el);
  }
  return el;
}

function ensureCodeStyleEl() {
  let el = document.getElementById('gallery-config-code');
  if (!el) {
    el = document.createElement('style');
    el.id = 'gallery-config-code';
    document.head.appendChild(el);
  }
  return el;
}

/** @param {TitleFaceConfig} face @param {typeof DEFAULT_CONFIG.theme.typography} typo */
export function resolveTitleFaceTypography(face, typo) {
  const titleLh = face.lineHeight ?? typo.titleLineHeight ?? '1.12';
  const headingLh = face.headingLineHeight ?? face.lineHeight ?? typo.titleHeadingLineHeight ?? '0.95';
  const letterSpacing = face.letterSpacing ?? typo.titleFaceLetterSpacing ?? '0.02em';
  return { titleLh, headingLh, letterSpacing };
}

export function buildTitleFaceStylesheet(cfg) {
  const typo = { ...DEFAULT_CONFIG.theme.typography, ...(cfg.theme?.typography || {}) };
  const faces = cfg.fonts?.titleFaces ?? DEFAULT_CONFIG.fonts.titleFaces;
  const blocks = [];

  for (const face of faces) {
    const { titleLh, headingLh, letterSpacing } = resolveTitleFaceTypography(face, typo);
    const sel = `.post-card.title-face-${face.id}`;
    const titleSel = `${sel} .poster__title,${sel} .post-title,${sel} .post-title a`;
    const headingSel = `${sel} .prose :is(h2,h3,h4)`;
    const legendSel = `.legend-sample.title-face-${face.id}`;
    const collectionTitleSel = `.collection-card.title-face-${face.id} .poster__title`;
    blocks.push(
      `${titleSel}{line-height:${titleLh};letter-spacing:${letterSpacing};}\n` +
        `${collectionTitleSel}{line-height:${titleLh};letter-spacing:${letterSpacing};}\n` +
        `${headingSel}{line-height:${headingLh};letter-spacing:${letterSpacing};}\n` +
        `${legendSel}{letter-spacing:${letterSpacing};}`
    );
  }

  return blocks.join('\n\n');
}

function ensureTitleFaceStyleEl() {
  let el = document.getElementById('gallery-config-title-faces');
  if (!el) {
    el = document.createElement('style');
    el.id = 'gallery-config-title-faces';
    document.head.appendChild(el);
  }
  return el;
}

export function applyGalleryConfigToDocument(cfg = activeConfig) {
  const root = document.documentElement;
  const colors = themeColors(cfg);
  const layout = { ...DEFAULT_CONFIG.theme.layout, ...(cfg.theme?.layout || {}) };
  const hero = { ...DEFAULT_CONFIG.theme.hero, ...(cfg.theme?.hero || {}) };
  const typo = { ...DEFAULT_CONFIG.theme.typography, ...(cfg.theme?.typography || {}) };
  const motion = { ...DEFAULT_CONFIG.theme.motion, ...(cfg.theme?.motion || {}) };
  const graphics = { ...DEFAULT_CONFIG.theme.graphics, ...(cfg.theme?.graphics || {}) };
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const dark = { ...DEFAULT_CONFIG.darkTheme, ...(cfg.darkTheme || {}) };
  const darkColors = { ...DEFAULT_CONFIG.darkTheme.colors, ...(dark.colors || {}) };
  const { fonts } = cfg;

  for (const legacy of ['--paper', '--ink', '--ink-soft', '--red', '--red-bright', '--measure']) {
    root.style.removeProperty(legacy);
  }

  root.style.setProperty('--config-paper', colors.paper);
  root.style.setProperty('--config-ink', colors.ink);
  root.style.setProperty('--config-ink-soft', colors.inkSoft);
  root.style.setProperty('--config-ink-mute', colors.inkMute);
  root.style.setProperty('--config-red', colors.red);
  root.style.setProperty('--config-red-bright', colors.redBright);

  root.style.setProperty('--config-measure', layout.measure);
  root.style.setProperty('--config-poster-width', layout.posterWidth || layout.measure);
  const edgeMix = Math.min(0.4, Math.max(0.04, Number(layout.edgeStepMix) || 0.12));
  root.style.setProperty('--config-edge-mix', `${Math.round(edgeMix * 100)}%`);
  root.style.setProperty('--config-pad', layout.pad);
  root.style.setProperty('--config-scroll-offset', layout.scrollOffset);

  root.style.setProperty('--config-hero-display', resolveColor(hero.display, cfg));
  root.style.setProperty('--config-hero-body', resolveColor(hero.body, cfg));
  root.style.setProperty('--config-hero-muted', resolveColor(hero.muted, cfg));

  root.style.setProperty('--config-body-size', typo.bodySize);
  root.style.setProperty('--config-body-line-height', String(typo.bodyLineHeight));
  root.style.setProperty('--config-prose-line-height', String(typo.proseLineHeight ?? '1.6'));
  root.style.setProperty('--config-title-line-height', String(typo.titleLineHeight ?? '1.12'));
  root.style.setProperty(
    '--config-title-heading-line-height',
    String(typo.titleHeadingLineHeight ?? '0.95')
  );
  root.style.setProperty(
    '--config-title-face-letter-spacing',
    typo.titleFaceLetterSpacing ?? '0.02em'
  );
  root.style.setProperty('--config-label-size', typo.labelSize);
  root.style.setProperty('--config-label-weight', String(typo.labelWeight));
  root.style.setProperty('--config-label-letter-spacing', typo.labelLetterSpacing);
  root.style.setProperty('--config-prose-size', typo.proseSize);
  root.style.setProperty('--config-crumb-size', typo.crumbSize);

  root.style.setProperty('--config-card-hover-ease', motion.cardHoverEase);
  root.style.setProperty('--config-card-hover-duration', motion.cardHoverDuration);
  root.style.setProperty('--config-reveal-duration', motion.revealDuration ?? '0.8s');
  root.style.setProperty('--config-reveal-ease', motion.revealEase ?? 'ease');
  root.style.setProperty('--config-shutter-duration', motion.shutterDuration ?? '0.9s');
  root.style.setProperty('--config-shutter-ease', motion.shutterEase ?? 'cubic-bezier(0.77, 0, 0.18, 1)');

  const glyphTokens = resolveGlyphPatternTokens(cfg);
  const glyphOpacity = glyphTokens.opacity;
  const glyphColor =
    glyphTokens.color === 'display'
      ? resolveColor(hero.display, cfg)
      : resolveColor(glyphTokens.color, cfg);
  root.style.setProperty('--config-glyph-pattern-color', glyphColor);
  root.style.setProperty('--config-glyph-pattern-opacity', String(glyphOpacity));

  const iso = resolveImageIsometricOptions(cfg);
  for (const [name, value] of Object.entries(imageIsometricCssVars(iso))) {
    root.style.setProperty(name, value);
  }

  root.style.setProperty('--config-code-text', resolveColor(code.text ?? 'paper', cfg));
  root.style.setProperty('--config-code-inline-mix', code.inlineSurfaceMix ?? '35%');
  const blockMix = resolveCodeStepMix(cfg);
  root.style.setProperty('--config-code-block-step-mix', `${Math.round(blockMix * 100)}%`);

  root.style.setProperty('--config-dark-paper', dark.paper ?? DEFAULT_CONFIG.darkTheme.paper);
  root.style.setProperty('--config-dark-ink', darkColors.ink);
  root.style.setProperty('--config-dark-ink-soft', darkColors.inkSoft);
  root.style.setProperty('--config-dark-ink-mute', darkColors.inkMute);
  root.style.setProperty('--config-dark-red', darkColors.red);
  root.style.setProperty('--config-dark-red-bright', darkColors.redBright);
  root.style.setProperty(
    '--config-dark-drop-butter-mix',
    dark.dropZone?.butterMix ?? DEFAULT_CONFIG.darkTheme.dropZone.butterMix
  );

  const defs = getGroundDefs(cfg);
  for (const [name, def] of Object.entries(defs)) {
    root.style.setProperty(`--ground-${name}`, def.surface);
  }

  root.style.setProperty('--font-ui-sans', `'${fonts.uiSans.family}', system-ui, sans-serif`);
  root.style.setProperty('--font-ui-serif', `'${fonts.uiSerif.family}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty(
    '--font-mono',
    `'${fonts.mono.family}', ui-monospace, SFMono-Regular, Menlo, monospace`
  );
  root.style.setProperty(
    '--config-ui-sans-line-height',
    String(fonts.uiSans?.lineHeight ?? typo.bodyLineHeight)
  );
  root.style.setProperty(
    '--config-ui-serif-line-height',
    String(fonts.uiSerif?.lineHeight ?? typo.bodyLineHeight)
  );
  root.style.setProperty(
    '--config-mono-line-height',
    String(fonts.mono?.lineHeight ?? DEFAULT_CONFIG.fonts.mono.lineHeight ?? '1.45')
  );

  const link = document.getElementById('fonts-link');
  if (link) link.href = fontsHrefFromConfig(cfg);

  if (typeof document !== 'undefined') {
    ensureGroundStyleEl().textContent = buildGroundStylesheet(cfg);
    ensureCodeStyleEl().textContent = buildCodeStylesheet(cfg);
    ensureTitleFaceStyleEl().textContent = buildTitleFaceStylesheet(cfg);
  }
}

export { DEFAULT_CONFIG };
