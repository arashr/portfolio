import {
  buildCodeStylesheetForExport,
  buildExportRootVars,
  buildGroundStylesheet,
  buildTitleFaceStylesheet,
  getGalleryConfig,
  getGroundDefs,
  resolveColor
} from './gallery-config.js';

/** @param {string} name */
export function posterPdfFilename(name) {
  const base =
    String(name)
      .trim()
      .replace(/[^\w\s-]+/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'poster';
  return `${base}.pdf`;
}

/** html2canvas 1.x cannot parse oklch(), color-mix(), lab(), etc. */
const UNSUPPORTED_COLOR_RE = /oklch|color-mix|(?:^|[\s,])lab\(|\blch\(/i;
const COLOR_FN_START_RE = /(?:oklch|color-mix|lab|lch)\(/gi;

const EXPORT_CSS_HREFS = ['assets/site.css', 'assets/reader.css'];
/** @type {Map<string, string>} */
const exportCssCache = new Map();

/**
 * @param {HTMLElement} card
 */
function exportColorContext(card) {
  const wrap = document.createElement('div');
  wrap.className = [...card.classList]
    .filter((c) => c.startsWith('ground-') || c.startsWith('title-face-') || c === 'post-card')
    .join(' ');
  wrap.style.cssText =
    'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;contain:strict;';
  document.body.appendChild(wrap);
  return wrap;
}

/**
 * @param {string} value
 * @param {HTMLElement} context
 */
function resolvePaintInContext(value, context) {
  if (!value || value === 'none' || value === 'transparent') return value;
  if (!UNSUPPORTED_COLOR_RE.test(value)) return value;

  const props = ['color', 'background-color', 'background', 'border-color', 'outline-color'];
  for (const prop of props) {
    const probe = document.createElement('span');
    context.appendChild(probe);
    probe.style.setProperty(prop, value);
    const resolved = getComputedStyle(probe).getPropertyValue(prop);
    probe.remove();
    if (resolved && !UNSUPPORTED_COLOR_RE.test(resolved)) return resolved.trim();
  }

  const probe = document.createElement('span');
  probe.style.cssText = 'position:fixed;left:-9999px;visibility:hidden;pointer-events:none;';
  probe.style.setProperty('color', value);
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).getPropertyValue('color');
  probe.remove();
  if (!resolved || UNSUPPORTED_COLOR_RE.test(resolved)) return null;
  return resolved.trim();
}

/**
 * @param {string} css
 * @param {HTMLElement} context
 */
function sanitizeCssForExport(css, context) {
  const spans = [];
  let i = 0;
  while (i < css.length) {
    COLOR_FN_START_RE.lastIndex = i;
    const m = COLOR_FN_START_RE.exec(css);
    if (!m || m.index === undefined) break;
    const start = m.index;
    const open = css.indexOf('(', start);
    if (open < 0) break;
    let depth = 0;
    let j = open;
    for (; j < css.length; j++) {
      if (css[j] === '(') depth++;
      else if (css[j] === ')') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    spans.push({ start, end: j, text: css.slice(start, j) });
    i = j;
  }

  if (!spans.length) return css;

  let out = '';
  let last = 0;
  for (const { start, end, text } of spans) {
    out += css.slice(last, start);
    out += resolvePaintInContext(text, context) ?? 'transparent';
    last = end;
  }
  return out + css.slice(last);
}

/**
 * @param {HTMLElement} card
 */
async function buildExportStylesheet(card) {
  const cfg = getGalleryConfig();
  const context = exportColorContext(card);
  try {
    const chunks = [
      buildExportRootVars(cfg),
      buildGroundStylesheet(cfg),
      buildCodeStylesheetForExport(cfg),
      buildTitleFaceStylesheet(cfg)
    ];

    for (const href of EXPORT_CSS_HREFS) {
      const url = new URL(href, window.location.href).href;
      let raw = exportCssCache.get(url);
      if (!raw) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load ${href}`);
        raw = await res.text();
        exportCssCache.set(url, raw);
      }
      chunks.push(sanitizeCssForExport(raw, context));
    }

    return chunks.join('\n');
  } finally {
    context.remove();
  }
}

/**
 * @param {HTMLElement} root
 * @param {HTMLElement} context
 */
function inlineUnsupportedColors(root, context) {
  const props = [
    'color',
    'background-color',
    'background',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'column-rule-color',
    'caret-color',
    'fill',
    'stroke'
  ];

  const nodes = [root, ...root.querySelectorAll('*')];
  for (const el of nodes) {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
    const cs = getComputedStyle(el);
    for (const prop of props) {
      const val = cs.getPropertyValue(prop);
      if (!val || !UNSUPPORTED_COLOR_RE.test(val)) continue;
      const fixed = resolvePaintInContext(val, context);
      if (fixed) el.style.setProperty(prop, fixed, 'important');
    }
  }
}

/**
 * Pin poster surface + foreground tokens from config (hex) so export colors match the screen.
 *
 * @param {HTMLElement} card
 */
function pinGroundColors(card) {
  const groundClass = [...card.classList].find((c) => c.startsWith('ground-'));
  if (!groundClass) return;

  const name = groundClass.slice('ground-'.length);
  const cfg = getGalleryConfig();
  const def = getGroundDefs(cfg)[name];
  if (!def) return;

  const surface = resolveColor(def.surface, cfg);
  const fg = def.foreground ?? {};
  card.style.setProperty('background-color', surface, 'important');
  card.style.setProperty('--surface', surface, 'important');
  card.style.setProperty('--on-ground-display', resolveColor(fg.display ?? 'ink', cfg), 'important');
  card.style.setProperty('--on-ground-body', resolveColor(fg.body ?? 'ink', cfg), 'important');
  card.style.setProperty('--on-ground-muted', resolveColor(fg.muted ?? 'ink', cfg), 'important');
  card.style.setProperty('--on-ground-accent', resolveColor(fg.accent ?? 'ink', cfg), 'important');
}

/** Drop linked/authored stylesheets from html2canvas's clone document (they contain oklch). */
function stripCloneStylesheets(doc) {
  doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
}

/**
 * @param {Document} doc
 * @param {string} exportCss
 */
function injectExportStyles(doc, exportCss) {
  const style = doc.createElement('style');
  style.id = 'md-gallery-export-styles';
  style.textContent = exportCss;
  doc.head.appendChild(style);

  const fontsHref = document.getElementById('fonts-link')?.getAttribute('href');
  if (fontsHref) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontsHref;
    doc.head.appendChild(link);
  }
}

/**
 * Best-effort: inline any loadable external <img> sources to avoid tainted canvases.
 *
 * @param {HTMLElement} root
 */
async function inlineExportImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;

      let url;
      try {
        url = new URL(src, window.location.href);
      } catch {
        return;
      }

      const isSameOrigin = url.origin === window.location.origin;
      if (!isSameOrigin) img.crossOrigin = 'anonymous';

      try {
        const res = await fetch(url.href, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(blob);
        });
        if (dataUrl) img.src = dataUrl;
      } catch {
        const placeholder = document.createElement('div');
        placeholder.className = 'export-img-placeholder';
        placeholder.textContent = img.getAttribute('alt')?.trim() || 'Image omitted';
        placeholder.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'min-height:120px',
          'padding:12px',
          'border:2px solid currentColor',
          'opacity:0.85',
          'font-family:inherit',
          'font-size:14px',
          'text-align:center'
        ].join(';');
        img.replaceWith(placeholder);
      }
    })
  );
}

/** jsPDF UMD bundle (index.html) — ESM build has bare imports the import map cannot resolve. */
function loadJsPDF() {
  const ctor = globalThis.jspdf?.jsPDF ?? globalThis.jspdf?.default;
  if (typeof ctor !== 'function') {
    throw new Error('jsPDF failed to load (check node_modules/jspdf is installed)');
  }
  return ctor;
}

/**
 * Render a poster card to a PDF download (client-side only).
 * The PDF is a high-resolution snapshot (PNG in PDF), not selectable text.
 *
 * @param {HTMLElement} card
 * @param {string} [filename]
 */
export async function exportPosterAsPdf(card, filename = 'poster') {
  if (!card) throw new Error('Missing poster');

  const { default: html2canvas } = await import('html2canvas');
  const jsPDF = loadJsPDF();

  card.classList.add('is-exporting');
  const colorContext = exportColorContext(card);
  let exportCss = '';
  try {
    if (document.fonts?.ready) await document.fonts.ready;

    exportCss = await buildExportStylesheet(card);
    await inlineExportImages(card);

    const posterBg =
      resolvePaintInContext(getComputedStyle(card).backgroundColor, colorContext) || '#eff1f3';

    const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));

    const canvas = await html2canvas(card, {
      scale,
      useCORS: true,
      backgroundColor: posterBg,
      logging: false,
      imageTimeout: 15000,
      onclone(doc, ref) {
        stripCloneStylesheets(doc);
        injectExportStyles(doc, exportCss);
        if (ref instanceof HTMLElement) {
          pinGroundColors(ref);
          inlineUnsupportedColors(ref, colorContext);
          ref.querySelectorAll('.post-card__toolbar, .code-block__copy').forEach((el) => el.remove());
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [canvas.width, canvas.height],
      compress: true
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
    pdf.save(posterPdfFilename(filename));
  } finally {
    colorContext.remove();
    card.classList.remove('is-exporting');
  }
}
