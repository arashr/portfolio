/**
 * Mosaic layer — tile many type-patterns in a grid, each cell with randomized options.
 */

import {
  renderTypePattern,
  PATTERN_TYPES,
  TYPE_PATTERN_DEFAULTS,
} from './type-pattern.js';

const MOSAIC_DEFAULTS = {
  gridCols: 3,
  gridRows: 3,
  gap: 6,
  /** Fit as many tiles as possible; ignores gridCols / gridRows. */
  autoFill: false,
  /** Target tile size (px) when autoFill is true. */
  targetTileSize: 120,
  backgroundColor: '#e8e4dc',
  /** When true, pick random pattern options (once or per cell; see sameTilePattern). */
  randomize: true,
  /** When true, every cell uses the same pattern options. */
  sameTilePattern: false,
  /** Fixed pattern for all cells when sameTilePattern is true (skips randomize). */
  tilePattern: null,
  /** Optional seed for reproducible randomization. */
  seed: null,
  /** Applied to every cell; backgroundColor / foregroundColor always win. */
  sharedOptions: {},
  /** Override per cell: (row, col, rng) => partial options */
  getCellOptions: null,
};

/**
 * @param {() => number} rng
 */
function createRng(seed) {
  if (seed == null) return Math.random;
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build randomized options for one `renderTypePattern` cell.
 *
 * @param {string} letter
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} [constraints]
 * @param {() => number} [rng]
 */
export function randomizePatternOptions(letter, constraints = {}, rng = Math.random) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const range = (min, max) => min + rng() * (max - min);
  const int = (min, max) => Math.floor(range(min, max + 1));
  const maybe = (p = 0.5) => rng() < p;

  const { types: typePool, ...rest } = constraints;
  const types = typePool ?? PATTERN_TYPES;

  return {
    letter: String(letter || 'A').slice(0, 1) || 'A',
    type: pick(types),
    repeats: int(10, 42),
    followPath: maybe(0.85),
    flipReadable: maybe(0.55),
    flipAlternateVertical: maybe(0.4),
    flipAlternateHorizontal: maybe(0.4),
    lineAngle: int(0, 360),
    startAngle: range(-Math.PI, Math.PI),
    arcSweep: range(Math.PI * 0.35, Math.PI * 2),
    spiralTurns: range(1, 4.5),
    waveAmplitude: range(0.12, 0.38),
    waveCycles: int(1, 7),
    fillAngle: int(-28, 28),
    padding: int(6, 20),
    backgroundColor:
      rest.backgroundColor ?? TYPE_PATTERN_DEFAULTS.backgroundColor,
    foregroundColor:
      rest.foregroundColor ?? TYPE_PATTERN_DEFAULTS.foregroundColor,
    ...rest,
  };
}

function withSharedColors(cellOpts, sharedOptions = {}) {
  const out = { ...cellOpts };
  if (sharedOptions.backgroundColor != null) {
    out.backgroundColor = sharedOptions.backgroundColor;
  }
  if (sharedOptions.foregroundColor != null) {
    out.foregroundColor = sharedOptions.foregroundColor;
  }
  return out;
}

function resolveTilePattern(letter, opts, rng) {
  const char = String(letter || 'A').slice(0, 1) || 'A';
  const base = { letter: char, ...opts.sharedOptions };

  if (opts.tilePattern) {
    return withSharedColors({ ...base, ...opts.tilePattern }, opts.sharedOptions);
  }
  if (opts.randomize) {
    return withSharedColors(
      randomizePatternOptions(char, opts.sharedOptions, rng),
      opts.sharedOptions
    );
  }
  return withSharedColors(base, opts.sharedOptions);
}

/**
 * Gap only between tiles (not an outer margin). At gap 0, tiles fill the canvas exactly.
 */
function resolveMosaicGrid(w, h, opts) {
  const gap = Math.max(0, opts.gap);
  let gridCols = Math.max(1, Math.floor(opts.gridCols));
  let gridRows = Math.max(1, Math.floor(opts.gridRows));

  if (opts.autoFill) {
    const target = Math.max(24, opts.targetTileSize || Math.min(w, h) / 3);
    if (gap === 0) {
      gridCols = Math.max(1, Math.round(w / target));
      gridRows = Math.max(1, Math.round(h / target));
    } else {
      gridCols = Math.max(1, Math.floor((w + gap) / (target + gap)));
      gridRows = Math.max(1, Math.floor((h + gap) / (target + gap)));
    }
  }

  const cellW =
    gridCols > 1 ? (w - gap * (gridCols - 1)) / gridCols : w;
  const cellH =
    gridRows > 1 ? (h - gap * (gridRows - 1)) / gridRows : h;

  return { gridCols, gridRows, gap, cellW, cellH };
}

/**
 * Render a grid of mini patterns; each cell calls `renderTypePattern` with its own options.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} letter
 * @param {Partial<typeof MOSAIC_DEFAULTS> & {
 *   width?: number;
 *   height?: number;
 *   gridCols?: number;
 *   gridRows?: number;
 * }} [options]
 */
export function renderTypePatternMosaic(canvas, letter, options = {}) {
  const opts = { ...MOSAIC_DEFAULTS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rng = createRng(opts.seed);
  const dpr = window.devicePixelRatio || 1;
  const w =
    options.width ??
    (canvas.clientWidth || canvas.parentElement?.clientWidth || 400);
  const h =
    options.height ??
    (canvas.clientHeight || canvas.parentElement?.clientHeight || 400);

  const { gridCols, gridRows, gap, cellW, cellH } = resolveMosaicGrid(w, h, opts);

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = opts.backgroundColor;
  ctx.fillRect(0, 0, w, h);
  const tileCanvas = document.createElement('canvas');
  const cells = [];

  const char = String(letter || 'A').slice(0, 1) || 'A';
  const sharedTileOpts = opts.sameTilePattern
    ? resolveTilePattern(char, opts, rng)
    : null;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      let cellOpts;

      if (sharedTileOpts) {
        cellOpts = sharedTileOpts;
      } else if (typeof opts.getCellOptions === 'function') {
        cellOpts = withSharedColors(
          { letter: char, ...opts.sharedOptions, ...opts.getCellOptions(row, col, rng) },
          opts.sharedOptions
        );
      } else if (opts.randomize) {
        cellOpts = resolveTilePattern(char, opts, rng);
      } else {
        cellOpts = withSharedColors(
          { letter: char, ...opts.sharedOptions },
          opts.sharedOptions
        );
      }

      renderTypePattern(tileCanvas, {
        ...cellOpts,
        width: cellW,
        height: cellH,
      });

      const x = col * (cellW + gap);
      const y = row * (cellH + gap);
      ctx.drawImage(tileCanvas, x, y, cellW, cellH);

      cells.push({ row, col, x, y, options: cellOpts });
    }
  }

  return {
    width: w,
    height: h,
    gridCols,
    gridRows,
    gap,
    autoFill: opts.autoFill,
    cellWidth: cellW,
    cellHeight: cellH,
    cells,
  };
}

export {
  MOSAIC_DEFAULTS as TYPE_PATTERN_MOSAIC_DEFAULTS,
  PATTERN_TYPES,
  TYPE_PATTERN_DEFAULTS,
};
