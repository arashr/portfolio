import { TYPE_PATTERN_DEFAULTS } from './type-pattern-poster.js';
import { IMAGE_HALFTONE_DEFAULTS } from './image-halftone-config.js';
import { IMAGE_ISO_DEFAULTS } from './image-iso-config.js';
import { HERO_GLYPH_DEFAULTS } from './poster-hero-glyph.js';
import { resolveGlyphPatternTokens } from './resolve-graphics-config.js';
import { normalizeOpacityRange } from './glyph-blend-opacity.js';
import { resolveImageIsometricOptions, imageIsometricCssVars } from './image-iso-config.js';
import {
  GROUND_COLOR_DEFAULTS,
  groundForegroundRefs,
  groundSurfaceRef
} from './ground-tokens.js';

/** @typedef {{ minPx?: number, maxPx?: number, maxWidthRatio?: number, floorPx?: number, slackMinPx?: number, bAspect?: number, tiers?: Array<{ maxChars?: number | null, minPx?: number, maxPx?: number, maxWidthRatio?: number, maxLines?: number, maxPxRatio?: number, floorPx?: number }> }} TitleScaleConfig */
/** @typedef {{ id: string, google: string, lineHeight?: string, headingLineHeight?: string, letterSpacing?: string, titleScale?: TitleScaleConfig }} TitleFaceConfig */
/** @typedef {{ display?: string, body?: string, muted?: string, accent?: string, focus?: string, linkHoverText?: string, linkHoverBg?: string }} GroundForeground */
/**
 * @typedef {{
 *   color?: string,
 *   opacity?: number,
 *   opacityMin?: number,
 *   opacityMax?: number,
 *   blendMode?: string,
 *   blendModes?: string[] | Record<string, { min?: number, max?: number }>,
 *   appearance?: { opacity?: number, opacityMin?: number, opacityMax?: number }
 * }} GroundGlyph
 * @typedef {GroundGlyph} GroundHeroGlyph
/** @typedef {{ surface: string, foreground?: GroundForeground, glyph?: GroundGlyph, heroGlyph?: GroundHeroGlyph, codeChipPaperMix?: string }} GroundDef */
/** @typedef {string | GroundDef} GroundEntry */

/** Mirrors `assets/css/site/01-tokens.css` — JS fallbacks when CSS is unavailable. */
const THEME_COLOR_DEFAULTS = {
  paper: '#fff9f5',
  ink: '#0c0e10',
  inkSoft: '#1b1f24',
  inkMute: 'rgba(12, 14, 16, 0.66)',
  red: '#c8102e',
  redBright: '#e8334e'
};

const DARK_THEME_COLOR_DEFAULTS = {
  paper: '#12151a',
  ink: '#eef0f4',
  inkSoft: '#c8cdd6',
  inkMute: '#c0c8d4',
  red: '#ffa0ab',
  redBright: '#ffb3bc'
};

const TYPOGRAPHY_TOKEN_DEFAULTS = {
  bodySize: '16px',
  bodyLineHeight: '1.3',
  proseLineHeight: '1.55',
  titleLineHeight: '1.12',
  titleHeadingLineHeight: '0.95',
  titleFaceLetterSpacing: '0.02em',
  labelSize: '0.85rem',
  labelWeight: '500',
  labelLetterSpacing: '0.06em',
  proseSize: '18px',
  crumbSize: '0.85rem'
};

function readRootToken(cssVar, fallback) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

const LAYOUT_TOKEN_DEFAULTS = {
  measure: '65ch',
  posterWidth: '42rem',
  edgeStepMix: 0.12,
  pad: 'clamp(16px, 4vw, 56px)',
  scrollOffset: '6.5rem'
};

const CODE_VISUAL_TOKEN_DEFAULTS = {
  inlineSurfaceMix: '45%',
  chipDarkBodyLift: '20%',
  chipLightSurfaceShade: '10%'
};

function parseEdgeMixPercent(raw) {
  const n = parseFloat(String(raw).replace('%', '').trim());
  if (!Number.isFinite(n)) return LAYOUT_TOKEN_DEFAULTS.edgeStepMix;
  return Math.min(0.4, Math.max(0.04, n / 100));
}

function layoutTokens() {
  return {
    measure: readRootToken('--measure', LAYOUT_TOKEN_DEFAULTS.measure),
    posterWidth: readRootToken('--poster-width', LAYOUT_TOKEN_DEFAULTS.posterWidth),
    edgeStepMix: parseEdgeMixPercent(readRootToken('--color-edge-mix', '12%')),
    pad: readRootToken('--space-page-inline', LAYOUT_TOKEN_DEFAULTS.pad),
    scrollOffset: readRootToken('--space-scroll-offset', LAYOUT_TOKEN_DEFAULTS.scrollOffset)
  };
}

function codeVisualTokens() {
  return {
    inlineSurfaceMix: readRootToken('--code-inline-mix', CODE_VISUAL_TOKEN_DEFAULTS.inlineSurfaceMix),
    chipDarkBodyLift: readRootToken('--code-chip-dark-lift', CODE_VISUAL_TOKEN_DEFAULTS.chipDarkBodyLift),
    chipLightSurfaceShade: readRootToken(
      '--code-chip-light-shade',
      CODE_VISUAL_TOKEN_DEFAULTS.chipLightSurfaceShade
    )
  };
}

const DEFAULT_CONFIG = {
  theme: {
    customCursor: {
      enabled: false
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
      imageHalftone: { ...IMAGE_HALFTONE_DEFAULTS },
      imageIsometric: { ...IMAGE_ISO_DEFAULTS },
      heroGlyph: { ...HERO_GLYPH_DEFAULTS },
      typePattern: { ...TYPE_PATTERN_DEFAULTS }
    },
    code: {
      blockSteps: 1,
      blockStepMix: 0.02,
      referenceSteps: 1,
      autoCompensateMix: false
    }
  },
  grounds: {
    pink: {},
    white: {},
    lime: {},
    tangerine: {},
    lilac: {},
    butter: {},
    mint: {},
    carmine: {},
    green: {},
    indigo: {}
  },
  fonts: {
    uiSans: {
      family: 'Space Grotesk',
      google: 'Space+Grotesk:wght@400;500;700'
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
      { id: 'space-grotesk', google: 'Space+Grotesk:wght@400;500;700', lineHeight: '0.95', letterSpacing: '-0.03em' },
      { id: 'archivo-black', google: 'Archivo+Black', lineHeight: '0.92', letterSpacing: '-0.02em' },
      {
        id: 'bricolage-grotesque',
        google: 'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800',
        lineHeight: '0.9',
        letterSpacing: '-0.03em'
      },
      {
        id: 'chakra-petch',
        google: 'Chakra+Petch:ital,wght@0,400;0,500;0,600;0,700;1,400',
        lineHeight: '0.95',
        letterSpacing: '-0.01em'
      },
      { id: 'ultra', google: 'Ultra', lineHeight: '1.1', letterSpacing: '-0.005em' },
      { id: 'dm-serif-display', google: 'DM+Serif+Display:ital@0;1', lineHeight: '1.05', letterSpacing: '-0.02em' },
      { id: 'unbounded', google: 'Unbounded:wght@400;700', lineHeight: '0.88', letterSpacing: '-0.02em' },
      { id: 'oswald', google: 'Oswald:wght@400;500;700', lineHeight: '0.92', letterSpacing: '0.01em' },
      { id: 'ibm-plex-mono', google: 'IBM+Plex+Mono:wght@400;500;700', lineHeight: '0.95', letterSpacing: '-0.02em' },
      { id: 'anton', google: 'Anton', lineHeight: '0.92', letterSpacing: '0.02em' }
    ],
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

export function normalizeGround(entry, name) {
  if (typeof entry === 'string') {
    return {
      surface: entry,
      foreground: { ...groundForegroundRefs(name) }
    };
  }
  const fg = { ...groundForegroundRefs(name), ...(entry.foreground || {}) };
  const out = {
    surface: entry.surface ?? groundSurfaceRef(name),
    foreground: fg
  };
  if (entry.codeChipPaperMix != null) out.codeChipPaperMix = entry.codeChipPaperMix;
  const nestedGlyph =
    fg.glyph && typeof fg.glyph === 'object' && !Array.isArray(fg.glyph) ? fg.glyph : null;
  if (nestedGlyph) delete fg.glyph;
  const groundGlyph =
    entry.glyph && typeof entry.glyph === 'object' && !Array.isArray(entry.glyph)
      ? entry.glyph
      : nestedGlyph;
  if (groundGlyph) out.glyph = { ...groundGlyph };
  const nestedHeroGlyph =
    fg.heroGlyph && typeof fg.heroGlyph === 'object' && !Array.isArray(fg.heroGlyph)
      ? fg.heroGlyph
      : null;
  if (nestedHeroGlyph) delete fg.heroGlyph;
  const groundHeroGlyph =
    entry.heroGlyph && typeof entry.heroGlyph === 'object' && !Array.isArray(entry.heroGlyph)
      ? entry.heroGlyph
      : nestedHeroGlyph;
  if (groundHeroGlyph) out.heroGlyph = { ...groundHeroGlyph };
  return out;
}

/** @param {unknown} entry Raw `grounds.<name>` config value. */
function isEmptyGroundEntry(entry) {
  return (
    entry != null &&
    typeof entry === 'object' &&
    !Array.isArray(entry) &&
    Object.keys(entry).length === 0
  );
}

/** @param {GroundDef} def @param {{ color: string, opacity: number }} globalGlyph */
export function resolveGroundGlyphTokens(def, cfg, globalGlyph) {
  const groundGlyph = def.glyph || {};
  const colorKey = groundGlyph.color ?? globalGlyph.color;
  const color =
    colorKey === 'display'
      ? resolveColor(def.foreground?.display, cfg)
      : resolveColor(colorKey, cfg);

  let opacity = globalGlyph.opacity;
  if (groundGlyph.opacity != null) {
    const n = Number.parseFloat(String(groundGlyph.opacity));
    if (Number.isFinite(n)) opacity = Math.min(1, Math.max(0, n));
  } else if (groundGlyph.opacityMin != null || groundGlyph.opacityMax != null) {
    const { opacityMin, opacityMax } = normalizeOpacityRange(
      groundGlyph.opacityMin,
      groundGlyph.opacityMax,
      { opacityMin: globalGlyph.opacity, opacityMax: globalGlyph.opacity }
    );
    opacity = (opacityMin + opacityMax) / 2;
  }

  return { color, opacity };
}

/** @returns {Record<string, GroundDef>} */
export function getGroundDefs(cfg = activeConfig) {
  const out = {};
  for (const [name, entry] of Object.entries(cfg.grounds || {})) {
    out[name] = normalizeGround(entry, name);
  }
  return out;
}

export function themeColors() {
  return {
    paper: readRootToken('--color-paper', THEME_COLOR_DEFAULTS.paper),
    ink: readRootToken('--color-ink', THEME_COLOR_DEFAULTS.ink),
    inkSoft: readRootToken('--color-ink-soft', THEME_COLOR_DEFAULTS.inkSoft),
    inkMute: readRootToken('--color-ink-muted', THEME_COLOR_DEFAULTS.inkMute),
    red: readRootToken('--color-accent', THEME_COLOR_DEFAULTS.red),
    redBright: readRootToken('--color-accent-bright', THEME_COLOR_DEFAULTS.redBright)
  };
}

export function darkThemeColors() {
  return {
    paper: readRootToken('--color-dark-paper', DARK_THEME_COLOR_DEFAULTS.paper),
    ink: readRootToken('--color-dark-ink', DARK_THEME_COLOR_DEFAULTS.ink),
    inkSoft: readRootToken('--color-dark-ink-soft', DARK_THEME_COLOR_DEFAULTS.inkSoft),
    inkMute: readRootToken('--color-dark-ink-muted', DARK_THEME_COLOR_DEFAULTS.inkMute),
    red: readRootToken('--color-dark-accent', DARK_THEME_COLOR_DEFAULTS.red),
    redBright: readRootToken('--color-dark-accent-bright', DARK_THEME_COLOR_DEFAULTS.redBright)
  };
}

export function typographyTokens() {
  return {
    bodySize: readRootToken('--font-size-body', TYPOGRAPHY_TOKEN_DEFAULTS.bodySize),
    bodyLineHeight: readRootToken('--line-height-body', TYPOGRAPHY_TOKEN_DEFAULTS.bodyLineHeight),
    proseLineHeight: readRootToken('--line-height-prose', TYPOGRAPHY_TOKEN_DEFAULTS.proseLineHeight),
    titleLineHeight: readRootToken('--line-height-title', TYPOGRAPHY_TOKEN_DEFAULTS.titleLineHeight),
    titleHeadingLineHeight: readRootToken(
      '--line-height-title-heading',
      TYPOGRAPHY_TOKEN_DEFAULTS.titleHeadingLineHeight
    ),
    titleFaceLetterSpacing: readRootToken(
      '--letter-spacing-title-face',
      TYPOGRAPHY_TOKEN_DEFAULTS.titleFaceLetterSpacing
    ),
    labelSize: readRootToken('--font-size-label', TYPOGRAPHY_TOKEN_DEFAULTS.labelSize),
    labelWeight: readRootToken('--font-weight-label', TYPOGRAPHY_TOKEN_DEFAULTS.labelWeight),
    labelLetterSpacing: readRootToken(
      '--letter-spacing-label',
      TYPOGRAPHY_TOKEN_DEFAULTS.labelLetterSpacing
    ),
    proseSize: readRootToken('--font-size-prose', TYPOGRAPHY_TOKEN_DEFAULTS.proseSize),
    crumbSize: readRootToken('--font-size-crumb', TYPOGRAPHY_TOKEN_DEFAULTS.crumbSize)
  };
}

/** Resolve semantic token (e.g. "red", "inkSoft", "ground-pink") or pass through hex/rgba. */
export function resolveColor(value, cfg = activeConfig) {
  if (value == null || value === '') return value;
  const s = String(value).trim();
  if (s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') || s.startsWith('var(')) {
    return s;
  }
  if (s === 'var(--hair)') return s;
  if (Object.hasOwn(GROUND_COLOR_DEFAULTS, s)) {
    return readRootToken(`--color-${s}`, GROUND_COLOR_DEFAULTS[s]);
  }
  const colors = themeColors();
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

/**
 * @param {TitleScaleConfig} base
 * @param {TitleScaleConfig | undefined} overrides
 * @returns {TitleScaleConfig}
 */
export function mergeTitleScale(base, overrides) {
  if (!overrides || typeof overrides !== 'object') return { ...base };
  return {
    ...base,
    ...overrides,
    tiers: overrides.tiers ?? base.tiers
  };
}

/**
 * Global `fonts.titleScale` merged with optional per-face `titleScale` overrides.
 * @param {string | null | undefined} faceId `fonts.titleFaces[].id`
 * @param {import('./gallery-config.js').GalleryConfig} [cfg]
 */
export function resolveTitleScaleForFace(faceId, cfg = activeConfig) {
  const global = cfg.fonts?.titleScale ?? DEFAULT_CONFIG.fonts.titleScale;
  if (!faceId) return { ...global };
  const face = cfg.fonts?.titleFaces?.find((f) => f.id === faceId);
  return mergeTitleScale(global, face?.titleScale);
}

/** @param {import('./gallery-config.js').GalleryConfig} cfg */
function normalizeTitleScalePlacement(cfg) {
  if (cfg.titleScale && isPlainObject(cfg.titleScale)) {
    cfg.fonts = cfg.fonts || {};
    cfg.fonts.titleScale = mergeTitleScale(
      cfg.fonts.titleScale ?? DEFAULT_CONFIG.fonts.titleScale,
      cfg.titleScale
    );
  }
  delete cfg.titleScale;
  if (!cfg.fonts?.titleScale) {
    cfg.fonts = { ...cfg.fonts, titleScale: structuredClone(DEFAULT_CONFIG.fonts.titleScale) };
  }
}

export function setGalleryConfig(partial) {
  activeConfig = mergeConfig(structuredClone(DEFAULT_CONFIG), partial || {});
  normalizeTitleScalePlacement(activeConfig);
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
  const globalGlyph = resolveGlyphPatternTokens(cfg);
  const lines = [];

  for (const [name, def] of Object.entries(defs)) {
    const raw = cfg.grounds?.[name];
    if (def.glyph) {
      const { color: glyphColor, opacity: glyphOpacity } = resolveGroundGlyphTokens(
        def,
        cfg,
        globalGlyph
      );
      lines.push(
        `.ground-${name}{--on-ground-glyph-pattern-color:${glyphColor};` +
          `--on-ground-glyph-pattern-opacity:${glyphOpacity};}`
      );
    } else if (name === 'mint' && isEmptyGroundEntry(raw)) {
      // Reader posters only — landing mini-posters keep display-color glyph fallback.
      const glyphColor = resolveColor(globalGlyph.color, cfg);
      lines.push(
        `#main-reader .post-card.ground-mint{--on-ground-glyph-pattern-color:${glyphColor};` +
          `--on-ground-glyph-pattern-opacity:${globalGlyph.opacity};}`
      );
    }
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
  const edgeMix = clampMix(layoutTokens().edgeStepMix);
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

function srgbChannelToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function linearToSrgbChannel(c) {
  const x = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, Math.round(x * 255)));
}

/** @returns {[number, number, number]} OKLCH: L 0–1, C ≥ 0, H 0–360 */
function rgbToOklch([r, g, b]) {
  const lr = srgbChannelToLinear(r);
  const lg = srgbChannelToLinear(g);
  const lb = srgbChannelToLinear(b);
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, b2);
  let H = (Math.atan2(b2, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b2 = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b2;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b2;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b2;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    linearToSrgbChannel(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  ];
}

function adjustOklchLightnessHex(hex, deltaL) {
  const [l, c, h] = rgbToOklch(parseHexRgb(hex));
  return rgbToHex(oklchToRgb(Math.min(1, Math.max(0, l + deltaL)), c, h));
}

function mixOklchLightnessTowardHex(hex, targetHex, amount) {
  const [l, c, h] = rgbToOklch(parseHexRgb(hex));
  const [targetL] = rgbToOklch(parseHexRgb(targetHex));
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex(oklchToRgb(Math.min(1, Math.max(0, l * (1 - t) + targetL * t)), c, h));
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
  const visual = codeVisualTokens();

  if (shouldDarkenCodeChip(groundName, groundDef, cfg)) {
    const shade = parsePercent(visual.chipLightSurfaceShade);
    return adjustOklchLightnessHex(surfaceHex, -shade);
  }

  const lift = parsePercent(visual.chipDarkBodyLift);
  let chip = adjustOklchLightnessHex(surfaceHex, lift);
  const paperMixRaw = groundDef?.codeChipPaperMix ?? code.chipPaperMix;
  if (paperMixRaw != null && paperMixRaw !== '') {
    chip = mixOklchLightnessTowardHex(chip, paperHex, parsePercent(paperMixRaw));
  }
  return chip;
}

/** OKLCH: lift chip lightness only — keeps ground chroma/hue (avoids muddy cross-hue mixes). */
export function codeChipBgMixExpr(surfaceVar = 'var(--surface)', liftPct = 20) {
  const delta = liftPct / 100;
  return `oklch(from ${surfaceVar} clamp(0, calc(l + ${delta}), 1) c h)`;
}

/** OKLCH: shade chip lightness only (white ground, carmine, page paper). */
export function codeChipShadeMixExpr(surfaceVar = 'var(--surface)', shadePct = 10) {
  const delta = shadePct / 100;
  return `oklch(from ${surfaceVar} clamp(0, calc(l - ${delta}), 1) c h)`;
}

export function buildCodeStylesheet(cfg) {
  const steps = resolveCodeBlockSteps(cfg);
  const groundBg = codeBlockBgMixExpr('var(--surface)', steps);
  const pageBg = codeBlockBgMixExpr('var(--paper)', steps);
  const visual = codeVisualTokens();
  const darkLiftPct = Math.round(parsePercent(visual.chipDarkBodyLift) * 100);
  const lightShadePct = Math.round(parsePercent(visual.chipLightSurfaceShade) * 100);
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

/** OKLCH-free code styles for html2canvas PDF export. */
export function buildCodeStylesheetForExport(cfg = activeConfig) {
  const steps = resolveCodeBlockSteps(cfg);
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
  const colors = themeColors();
  const layout = layoutTokens();
  const visual = codeVisualTokens();
  const edgeMix = layout.edgeStepMix;
  const blockMix = resolveCodeStepMix(cfg);
  const glyphTokens = resolveGlyphPatternTokens(cfg);
  const glyphOpacity = glyphTokens.opacity;
  const glyphColor =
    glyphTokens.color === 'display'
      ? readRootToken('--hero-display', colors.red)
      : resolveColor(glyphTokens.color, cfg);
  const groundVars = Object.entries(GROUND_COLOR_DEFAULTS)
    .map(([slug, hex]) => `--color-${slug}:${resolveColor(slug, cfg) || hex}`)
    .join(';');
  const groundSemanticVars = Object.keys(getGroundDefs(cfg))
    .map((name) => `--ground-${name}:${resolveColor(groundSurfaceRef(name), cfg)}`)
    .join(';');

  return (
    `:root{` +
    `--color-paper:${colors.paper};` +
    `--color-ink:${colors.ink};` +
    `--color-ink-soft:${colors.inkSoft};` +
    `--color-ink-muted:${colors.inkMute};` +
    `--color-accent:${colors.red};` +
    `--color-accent-bright:${colors.redBright};` +
    `--color-edge-mix:${Math.round(edgeMix * 100)}%;` +
    `--glyph-pattern-color:${glyphColor};` +
    `--glyph-pattern-opacity:${glyphOpacity};` +
    `--color-code-text:${resolveColor('paper', cfg)};` +
    `--code-inline-mix:${visual.inlineSurfaceMix};` +
    `--code-step-mix:${Math.round(blockMix * 100)}%;` +
    `${groundVars};` +
    `${groundSemanticVars};` +
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

/** @param {TitleFaceConfig} face @param {ReturnType<typeof typographyTokens>} typo */
export function resolveTitleFaceTypography(face, typo) {
  const titleLh = face.lineHeight ?? typo.titleLineHeight ?? '1.12';
  const headingLh = face.headingLineHeight ?? face.lineHeight ?? typo.titleHeadingLineHeight ?? '0.95';
  const letterSpacing = face.letterSpacing ?? typo.titleFaceLetterSpacing ?? '0.02em';
  return { titleLh, headingLh, letterSpacing };
}

export function buildTitleFaceStylesheet(cfg) {
  const typo = typographyTokens();
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
  const { fonts } = cfg;

  const blockMix = resolveCodeStepMix(cfg);
  root.style.setProperty('--code-step-mix', `${Math.round(blockMix * 100)}%`);

  const iso = resolveImageIsometricOptions(cfg);
  for (const [name, value] of Object.entries(imageIsometricCssVars(iso))) {
    root.style.setProperty(name, value);
  }

  root.style.setProperty('--font-ui-sans', `'${fonts.uiSans.family}', system-ui, sans-serif`);
  root.style.setProperty('--font-ui-serif', `'${fonts.uiSerif.family}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty(
    '--font-mono',
    `'${fonts.mono.family}', ui-monospace, SFMono-Regular, Menlo, monospace`
  );
  const typo = typographyTokens();
  root.style.setProperty(
    '--line-height-ui-sans',
    String(fonts.uiSans?.lineHeight ?? typo.bodyLineHeight)
  );
  root.style.setProperty(
    '--line-height-ui-serif',
    String(fonts.uiSerif?.lineHeight ?? typo.bodyLineHeight)
  );
  root.style.setProperty(
    '--line-height-mono',
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
