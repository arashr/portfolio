/**
 * TypePattern — fill an area with repeated letters along geometric paths.
 * Letters rotate to follow each path's tangent so shapes read naturally.
 *
 * @example
 * import { renderTypePattern } from './type-pattern.js';
 * renderTypePattern(canvas, { letter: 'A', repeats: 48, type: 'circle', ... });
 */

export const PATTERN_TYPES = [
  'line',
  'circle',
  'arc',
  'spiral',
  'wave',
  'grid',
  'fill',
];

const DEFAULTS = {
  letter: 'A',
  repeats: 40,
  type: 'circle',
  backgroundColor: '#f5f0e8',
  foregroundColor: '#1a1a1a',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: null,
  fontWeight: '400',
  padding: 32,
  /**
   * Pack the tile with a dense letter grid (auto columns/rows, max font size).
   * Ignores pattern type and padding; uses fillAngle / fillRowGap.
   */
  fillSpace: false,
  /**
   * Pack letters by glyph width; ignores padding and uses tight spacing along paths.
   */
  opticalTight: false,
  /** Letter-center spacing multiplier when opticalTight (× measured glyph width). */
  tightTracking: 0.96,
  /** Space between letter centers along the path (px). Auto if null. */
  spacing: null,
  /** Rotate letters to follow path tangent (recommended). */
  followPath: true,
  /** On curved paths, flip 180° when tangent points upside-down for readability. */
  flipReadable: true,
  /** Vertically flip every other letter (indices 1, 3, 5, …). */
  flipAlternateVertical: false,
  /** Horizontally flip every other letter (indices 1, 3, 5, …). */
  flipAlternateHorizontal: false,
  /** Pattern-specific */
  lineAngle: 0,
  startAngle: -Math.PI / 2,
  arcSweep: Math.PI * 1.5,
  spiralTurns: 2.5,
  waveAmplitude: 0.22,
  waveCycles: 3,
  gridColumns: null,
  gridStagger: true,
  fillAngle: -12,
  fillRowGap: 1.15,
  opacity: 1,
  blendMode: null,
  surfaceColor: null,
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Partial<typeof DEFAULTS> & { width?: number; height?: number }} options
 */
export function renderTypePattern(canvas, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w =
    options.width ??
    (canvas.clientWidth || canvas.parentElement?.clientWidth || 400);
  const h =
    options.height ??
    (canvas.clientHeight || canvas.parentElement?.clientHeight || 400);

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const letter = String(opts.letter || 'A').slice(0, 1) || 'A';
  const repeats = Math.max(1, Math.floor(opts.repeats));
  const pad = opts.fillSpace || opts.opticalTight ? 0 : opts.padding;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);
  const useBlend = Boolean(opts.blendMode && opts.surfaceColor);

  const patternOpts = { ...opts, padding: pad };
  let fontSize;
  let placements;

  if (opts.fillSpace) {
    const layout = resolveFillSpaceLayout(
      innerW,
      innerH,
      pad,
      letter,
      repeats,
      ctx,
      patternOpts
    );
    fontSize = opts.fontSize ?? layout.fontSize;
    placements = layout.placements;
  } else {
    fontSize =
      opts.fontSize ??
      estimateFontSize(opts.type, innerW, innerH, repeats, letter, ctx, patternOpts);
    ctx.font = `${opts.fontWeight} ${fontSize}px ${opts.fontFamily}`;
    const metrics = ctx.measureText(letter);
    const letterWidth = metrics.width || fontSize * 0.6;
    placements = computePlacements(opts.type, {
      repeats,
      letter,
      letterWidth,
      fontSize,
      pad,
      w,
      h,
      innerW,
      innerH,
      cx,
      cy,
      opts: patternOpts,
    });
  }

  const font = `${opts.fontWeight} ${fontSize}px ${opts.fontFamily}`;

  if (useBlend) {
    ctx.fillStyle = opts.surfaceColor;
    ctx.fillRect(0, 0, w, h);
  }

  const letterCanvas = document.createElement('canvas');
  letterCanvas.width = canvas.width;
  letterCanvas.height = canvas.height;
  const lctx = letterCanvas.getContext('2d');
  if (!lctx) {
    return { width: w, height: h, fontSize, count: placements.length };
  }

  lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lctx.clearRect(0, 0, w, h);
  lctx.fillStyle = opts.foregroundColor;
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.font = font;
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  placements.forEach((p, i) => drawLetter(lctx, letter, p.x, p.y, p.angle, opts, i));

  ctx.globalCompositeOperation = useBlend ? opts.blendMode : 'source-over';
  ctx.globalAlpha = Math.min(1, Math.max(0, opts.opacity));
  ctx.drawImage(letterCanvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  return { width: w, height: h, fontSize, count: placements.length };
}

/**
 * Dense grid that fills innerW × innerH; maximizes fontSize to fit.
 */
function resolveFillSpaceLayout(innerW, innerH, pad, letter, repeatsHint, ctx, opts) {
  const rowGap = opts.fillRowGap ?? 1.15;
  const angle = (opts.fillAngle * Math.PI) / 180;
  const tracking = opts.opticalTight ? (opts.tightTracking ?? 0.96) : 1.02;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = pad + innerW / 2;
  const cy = pad + innerH / 2;

  let fontSize = Math.max(
    8,
    Math.floor(Math.sqrt((innerW * innerH) / Math.max(repeatsHint, 1)) * 0.95)
  );

  let cols = 1;
  let rows = 1;

  for (let i = 0; i < 20; i++) {
    ctx.font = `${opts.fontWeight} ${fontSize}px ${opts.fontFamily}`;
    const lw = Math.max(ctx.measureText(letter).width, fontSize * 0.55);
    const lh = fontSize * 1.12;
    cols = Math.max(1, Math.floor(innerW / (lw * tracking)));
    rows = Math.max(1, Math.floor(innerH / (lh * rowGap)));
    const cellW = innerW / cols;
    const cellH = innerH / rows;
    const maxByW = Math.floor(cellW / 0.58);
    const maxByH = Math.floor(cellH / (1.12 * rowGap));
    const next = Math.min(maxByW, maxByH);
    if (next === fontSize || Math.abs(next - fontSize) <= 1) {
      fontSize = next;
      break;
    }
    fontSize = next;
  }

  ctx.font = `${opts.fontWeight} ${fontSize}px ${opts.fontFamily}`;
  const placements = [];
  const stepX = innerW / cols;
  const stepY = innerH / rows;

  for (let row = 0; row < rows; row++) {
    const rowOffset = row % 2 === 1 ? stepX / 2 : 0;
    for (let col = 0; col < cols; col++) {
      const lx = pad + col * stepX + stepX / 2 + rowOffset;
      const ly = pad + row * stepY + stepY / 2;
      const x = cx + (lx - cx) * cos - (ly - cy) * sin;
      const y = cy + (lx - cx) * sin + (ly - cy) * cos;
      placements.push({
        x,
        y,
        angle: opts.followPath ? angle : 0,
      });
    }
  }

  return { fontSize, placements, gridColumns: cols, gridRows: rows };
}

function tightStep(letterWidth, opts) {
  return letterWidth * (opts.tightTracking ?? 0.96);
}

function estimateFontSize(type, innerW, innerH, repeats, letter, ctx, opts) {
  const approx = Math.min(innerW, innerH);
  const tight = opts.opticalTight;
  if (type === 'fill' || type === 'grid') {
    const cols = opts.gridColumns ?? Math.ceil(Math.sqrt(repeats));
    const rows = Math.ceil(repeats / cols);
    return Math.floor(
      Math.min(innerW / (cols * 1.1), innerH / (rows * opts.fillRowGap * 1.2))
    );
  }
  if (type === 'line' || type === 'wave') {
    return Math.floor((innerW / repeats) * (tight ? 1.05 : 1.4));
  }
  if (type === 'circle' || type === 'arc' || type === 'spiral') {
    const r = Math.min(innerW, innerH) / 2;
    const sweep =
      type === 'arc' ? opts.arcSweep : type === 'spiral' ? opts.spiralTurns * Math.PI * 2 : Math.PI * 2;
    const arcLen = r * Math.abs(sweep);
    return Math.floor((arcLen / repeats) * (tight ? 1.02 : 0.85));
  }
  return Math.floor(approx / Math.sqrt(repeats) * 1.2);
}

/**
 * @returns {{ x: number, y: number, angle: number }[]}
 */
function computePlacements(type, env) {
  const { repeats, opts } = env;
  switch (type) {
    case 'line':
      return linePlacements(env);
    case 'circle':
      return circlePlacements(env, Math.PI * 2, opts.startAngle);
    case 'arc':
      return circlePlacements(env, opts.arcSweep, opts.startAngle);
    case 'spiral':
      return spiralPlacements(env);
    case 'wave':
      return wavePlacements(env);
    case 'grid':
      return gridPlacements(env);
    case 'fill':
      return fillPlacements(env);
    default:
      return circlePlacements(env, Math.PI * 2);
  }
}

function linePlacements({ repeats, letterWidth, innerW, innerH, cx, cy, opts }) {
  const angle = (opts.lineAngle * Math.PI) / 180;
  const len = Math.min(innerW, innerH * 2);
  const spacing =
    opts.spacing ??
    (opts.opticalTight
      ? tightStep(letterWidth, opts)
      : len / Math.max(repeats - 1, 1));
  const total = spacing * (repeats - 1);
  const out = [];
  for (let i = 0; i < repeats; i++) {
    const t = repeats === 1 ? 0.5 : i / (repeats - 1);
    const along = -total / 2 + t * total;
    out.push({
      x: cx + Math.cos(angle) * along,
      y: cy + Math.sin(angle) * along,
      angle: opts.followPath ? angle : 0,
    });
  }
  return out;
}

function circlePlacements(env, sweep, startAngle = -Math.PI / 2) {
  const { repeats, cx, cy, innerW, innerH, letterWidth, opts } = env;
  const maxR = (Math.min(innerW, innerH) / 2) * (opts.opticalTight ? 0.99 : 0.92);
  const step = tightStep(letterWidth, opts);
  const rFromLetters =
    sweep > 0 ? (repeats * step) / sweep : maxR;
  const r = opts.opticalTight
    ? Math.min(maxR, rFromLetters)
    : maxR;
  const out = [];
  for (let i = 0; i < repeats; i++) {
    const t = repeats === 1 ? 0.5 : i / (repeats - 1);
    const a = startAngle + t * sweep;
    const tangent = a + Math.PI / 2;
    out.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      angle: opts.followPath ? tangent : 0,
    });
  }
  return out;
}

function spiralPlacements(env) {
  const { repeats, cx, cy, innerW, innerH, opts } = env;
  const maxR = Math.min(innerW, innerH) / 2 * 0.92;
  const turns = opts.spiralTurns;
  const totalAngle = turns * Math.PI * 2;
  const out = [];
  for (let i = 0; i < repeats; i++) {
    const t = repeats === 1 ? 0.5 : i / (repeats - 1);
    const a = opts.startAngle + t * totalAngle;
    const r = maxR * t;
    const dr = maxR / Math.max(repeats - 1, 1);
    const da = totalAngle / Math.max(repeats - 1, 1);
    const tangent = Math.atan2(
      Math.sin(a) * dr + Math.cos(a) * r * da,
      Math.cos(a) * dr - Math.sin(a) * r * da
    );
    out.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      angle: opts.followPath ? tangent + Math.PI / 2 : 0,
    });
  }
  return out;
}

function wavePlacements(env) {
  const { repeats, pad, innerW, innerH, cx, cy, letterWidth, opts } = env;
  const amp = innerH * opts.waveAmplitude;
  const cycles = opts.waveCycles;
  const span = opts.opticalTight
    ? tightStep(letterWidth, opts) * Math.max(repeats - 1, 1)
    : innerW;
  const x0 = pad + (innerW - span) / 2;
  const out = [];
  for (let i = 0; i < repeats; i++) {
    const t = repeats === 1 ? 0.5 : i / (repeats - 1);
    const x = opts.opticalTight ? x0 + t * span : pad + t * innerW;
    const phase = t * cycles * Math.PI * 2;
    const y = cy + Math.sin(phase) * amp;
    const dx =
      (opts.opticalTight ? span : innerW) / Math.max(repeats - 1, 1);
    const dy =
      Math.cos(phase) * amp * (cycles * Math.PI * 2) / Math.max(repeats - 1, 1);
    const tangent = Math.atan2(dy, dx);
    out.push({
      x,
      y,
      angle: opts.followPath ? tangent : 0,
    });
  }
  return out;
}

function gridPlacements(env) {
  const { repeats, pad, innerW, innerH, opts } = env;
  const cols = opts.gridColumns ?? Math.ceil(Math.sqrt(repeats));
  const rows = Math.ceil(repeats / cols);
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  const out = [];
  let n = 0;
  for (let row = 0; row < rows && n < repeats; row++) {
    const offset = opts.gridStagger && row % 2 === 1 ? cellW / 2 : 0;
    for (let col = 0; col < cols && n < repeats; col++) {
      out.push({
        x: pad + col * cellW + cellW / 2 + offset,
        y: pad + row * cellH + cellH / 2,
        angle: opts.followPath ? (opts.fillAngle * Math.PI) / 180 : 0,
      });
      n++;
    }
  }
  return out;
}

function fillPlacements(env) {
  const { repeats, pad, innerW, innerH, opts } = env;
  const angle = (opts.fillAngle * Math.PI) / 180;
  const cols = opts.gridColumns ?? Math.ceil(Math.sqrt(repeats * 1.4));
  const rows = Math.ceil(repeats / cols);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const stepX = innerW / cols;
  const stepY = (innerH / rows) * opts.fillRowGap;
  const out = [];
  let n = 0;
  for (let row = 0; row < rows && n < repeats; row++) {
    const rowOffset = row % 2 === 1 ? stepX / 2 : 0;
    for (let col = 0; col < cols && n < repeats; col++) {
      const lx = pad + col * stepX + stepX / 2 + rowOffset;
      const ly = pad + row * stepY + stepY / 2;
      const x = pad + innerW / 2 + (lx - pad - innerW / 2) * cos - (ly - pad - innerH / 2) * sin;
      const y = pad + innerH / 2 + (lx - pad - innerW / 2) * sin + (ly - pad - innerH / 2) * cos;
      if (
        x >= pad &&
        x <= pad + innerW &&
        y >= pad &&
        y <= pad + innerH
      ) {
        out.push({
          x,
          y,
          angle: opts.followPath ? angle : 0,
        });
        n++;
      }
    }
  }
  return out.slice(0, repeats);
}

function drawLetter(ctx, letter, x, y, angle, opts, index = 0) {
  let a = angle;
  if (opts.flipReadable && opts.followPath) {
    const deg = ((a * 180) / Math.PI) % 360;
    if (deg > 90 && deg < 270) a += Math.PI;
  }

  const alternate = index % 2 === 1;
  const flipVertical =
    alternate &&
    (opts.flipAlternateVertical || opts.flipAlternate === true);
  const flipHorizontal = alternate && opts.flipAlternateHorizontal;
  const scaleX = flipHorizontal ? -1 : 1;
  const scaleY = flipVertical ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  if (opts.followPath) ctx.rotate(a);
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
  ctx.fillText(letter, 0, 0);
  ctx.restore();
}

export { DEFAULTS as TYPE_PATTERN_DEFAULTS, PATTERN_TYPES as typePatternTypes };
