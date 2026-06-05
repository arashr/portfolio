import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { getGroundDefs, resolveColor, codeChipBgFromSurface } from './gallery-config.js';

/** @typedef {'body' | 'muted' | 'display' | 'accent' | 'focus' | 'linkHover' | 'code'} ForegroundRole */

export const APCA_MIN = {
  body: 75,
  muted: 60,
  display: 60,
  accent: 60,
  focus: 60,
  linkHover: 60,
  code: 75
};

function hexToRgba(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1.0];
}

function rgbaFromResolved(resolved, cfg) {
  if (resolved.startsWith('#')) return hexToRgba(resolved);
  if (resolved.startsWith('rgba')) {
    const parts = resolved.match(/[\d.]+/g)?.map(Number) ?? [];
    const bg = hexToRgba(resolveColor('paper', cfg));
    const a = parts[3] ?? 1;
    return [...parts.slice(0, 3).map((v, i) => Math.round(v * a + bg[i] * (1 - a))), 1.0];
  }
  return hexToRgba(resolved);
}

export function apcaLc(textColor, bgColor, cfg) {
  const fg = rgbaFromResolved(resolveColor(textColor, cfg), cfg);
  const bg = rgbaFromResolved(resolveColor(bgColor, cfg), cfg);
  return Math.abs(Number(APCAcontrast(sRGBtoY(fg), sRGBtoY(bg))));
}

function linkHoverPair(def, cfg) {
  const fg = def.foreground;
  return {
    text: fg.linkHoverText ?? '#ffffff',
    bg: fg.linkHoverBg ?? 'ink'
  };
}

/** @returns {Array<{ scope: string, role: string, lc: number, min: number }>} */
export function auditGroundForegrounds(cfg) {
  const failures = [];
  const defs = getGroundDefs(cfg);

  for (const [name, def] of Object.entries(defs)) {
    for (const role of ['body', 'muted', 'display', 'accent', 'focus']) {
      const lc = apcaLc(def.foreground[role], def.surface, cfg);
      const min = APCA_MIN[role];
      if (lc < min) failures.push({ scope: name, role, lc, min });
    }

    const hover = linkHoverPair(def, cfg);
    const hoverLc = apcaLc(hover.text, hover.bg, cfg);
    if (hoverLc < APCA_MIN.linkHover) {
      failures.push({ scope: name, role: 'linkHover', lc: hoverLc, min: APCA_MIN.linkHover });
    }

    const codeText = def.foreground.body ?? cfg.theme?.code?.text ?? 'paper';
    const codeBg = codeChipBgFromSurface(def.surface, cfg, def, name);
    const codeLc = apcaLc(codeText, codeBg, cfg);
    if (codeLc < APCA_MIN.code) {
      failures.push({ scope: name, role: 'code', lc: codeLc, min: APCA_MIN.code });
    }
  }

  return failures;
}

/** @returns {Array<{ scope: string, role: string, lc: number, min: number }>} */
export function auditDarkChrome(cfg) {
  const failures = [];
  const dark = cfg.darkTheme ?? {};
  const colors = dark.colors ?? {};
  const paper = dark.paper ?? '#12151a';
  const checks = [
    ['inkSoft', APCA_MIN.body],
    ['inkMute', APCA_MIN.muted],
    ['red', APCA_MIN.display],
    ['redBright', APCA_MIN.focus]
  ];

  for (const [role, min] of checks) {
    const lc = apcaLc(colors[role], paper, cfg);
    if (lc < min) failures.push({ scope: 'dark-chrome', role, lc, min });
  }

  return failures;
}
