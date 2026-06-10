/** @param {number} value */
function single(value) {
  return { min: value, max: value };
}

/** @param {Record<string, unknown> | undefined} blendModes */
function firstBlendEntry(blendModes) {
  if (blendModes && typeof blendModes === 'object' && !Array.isArray(blendModes)) {
    const [mode, range] = Object.entries(blendModes)[0] ?? [];
    if (!mode) return { mode: 'overlay', range: single(0.15) };
    return { mode, range };
  }
  if (Array.isArray(blendModes) && blendModes.length) {
    return { mode: blendModes[0], range: single(0.15) };
  }
  return { mode: 'overlay', range: single(0.15) };
}

/**
 * Build a full gallery config from the saved base + lab control state (single values, no random ranges).
 * @param {import('./gallery-config.js').GalleryConfig} base
 * @param {Record<string, unknown>} state
 */
export function buildLabGalleryConfig(base, state) {
  const cfg = structuredClone(base);
  const g = cfg.theme.graphics ?? (cfg.theme.graphics = {});

  g.glyph = {
    ...(typeof g.glyph === 'object' && g.glyph ? g.glyph : {}),
    color: state.glyphColor,
    opacity: Number(state.glyphOpacity)
  };

  const patternBlend = String(state.patternBlend || 'overlay');
  const patternOpacity = Number(state.patternOpacity);
  const heroBlend = String(state.heroBlend || 'difference');
  const heroOpacity = Number(state.heroOpacity);

  g.typePattern = {
    roll: { noneProbability: Number(state.noneProbability) },
    symbol: {
      pool: String(state.symbolPool || '+*'),
      probability: Number(state.symbolProbability)
    },
    blendModes: {
      [patternBlend]: single(patternOpacity),
      plain: single(patternOpacity),
      normal: single(patternOpacity)
    },
    shape: {
      patternTypes: [String(state.patternType || 'wave')],
      fillSpace: Boolean(state.fillSpace),
      opticalTight: Boolean(state.opticalTight),
      followPath: Boolean(state.followPath),
      flipAlternateVertical: Boolean(state.flipAlternateVertical),
      flipAlternateHorizontal: Boolean(state.flipAlternateHorizontal)
    },
    geometry: {
      fontSizeMin: Number(state.fontSize),
      fontSizeMax: Number(state.fontSize),
      repeatsMin: Number(state.repeats),
      repeatsMax: Number(state.repeats),
      paddingMin: Number(state.padding),
      paddingMax: Number(state.padding),
      waveCyclesMin: Number(state.waveCycles),
      waveCyclesMax: Number(state.waveCycles),
      waveAmplitudeMin: Number(state.waveAmplitude),
      waveAmplitudeMax: Number(state.waveAmplitude),
      gridColumnsMin: Number(state.gridColumns),
      gridColumnsMax: Number(state.gridColumns),
      lineAngleMin: Number(state.lineAngle),
      lineAngleMax: Number(state.lineAngle)
    },
    placement: {
      emptySpaceMinPx: Number(state.emptySpaceMinPx),
      emptySpaceMinRatio: Number(state.emptySpaceMinRatio),
      regionInsetPx: Number(state.regionInsetPx),
      alignToCardEdge: Boolean(state.alignToCardEdge),
      fallbackBandWidth: Number(state.fallbackBandWidth),
      fallbackSide: String(state.fallbackSide || 'right'),
      edgeOverflowPx: Number(state.edgeOverflowPx)
    },
    appearance: {
      opacityMin: patternOpacity,
      opacityMax: patternOpacity
    }
  };

  g.heroGlyph = {
    roll: { probability: Number(state.heroProbability) },
    color: state.heroGlyphColor,
    opacityMin: heroOpacity,
    opacityMax: heroOpacity,
    blendModes: {
      [heroBlend]: single(heroOpacity)
    },
    text: {
      lengthMin: Number(state.heroLength),
      lengthMax: Number(state.heroLength)
    },
    layout: {
      sizeRatio: Number(state.heroSizeRatio),
      offsetXRatioMin: Number(state.heroOffsetX),
      offsetXRatioMax: Number(state.heroOffsetX)
    },
    accessibility: {
      excludeTitleFaces: Array.isArray(state.excludeTitleFaces) ? state.excludeTitleFaces : []
    }
  };

  g.imageHalftone = {
    ...(typeof g.imageHalftone === 'object' && g.imageHalftone ? g.imageHalftone : {}),
    enabled: Boolean(state.halftoneEnabled),
    dotPx: Number(state.halftoneDotPx),
    contrast: Number(state.halftoneContrast),
    saturation: Number(state.halftoneSaturation),
    angleDeg: Number(state.halftoneAngleDeg),
    pattern: String(state.halftonePattern || 'grid'),
    paper: String(state.halftonePaper || 'surface')
  };

  return cfg;
}

/** @param {import('./gallery-config.js').GalleryConfig} base */
export function readLabStateFromConfig(base) {
  const tp = base.theme?.graphics?.typePattern ?? {};
  const roll = tp.roll ?? {};
  const symbol = tp.symbol ?? {};
  const shape = tp.shape ?? {};
  const geometry = tp.geometry ?? {};
  const placement = tp.placement ?? {};
  const appearance = tp.appearance ?? {};
  const hero = base.theme?.graphics?.heroGlyph ?? {};
  const heroRoll = hero.roll ?? {};
  const heroText = hero.text ?? {};
  const heroLayout = hero.layout ?? {};
  const glyph = base.theme?.graphics?.glyph ?? {};
  const ht = base.theme?.graphics?.imageHalftone ?? {};

  const patternEntry = firstBlendEntry(tp.blendModes);
  const heroEntry = firstBlendEntry(hero.blendModes);
  const patternBlend = patternEntry.mode;
  const heroBlendMode = heroEntry.mode;
  const patternOpEntry = patternEntry.range;
  const heroOpEntry = heroEntry.range;

  return {
    glyphColor: glyph.color ?? 'display',
    glyphOpacity: glyph.opacity ?? 0.07,
    noneProbability: roll.noneProbability ?? 0,
    symbolPool: symbol.pool ?? '+*',
    symbolProbability: symbol.probability ?? 0.7,
    patternType: shape.patternTypes?.[0] ?? 'wave',
    patternBlend,
    patternOpacity:
      patternOpEntry?.min ?? patternOpEntry?.max ?? appearance.opacityMin ?? appearance.opacityMax ?? 0.15,
    fillSpace: shape.fillSpace ?? false,
    opticalTight: shape.opticalTight ?? true,
    followPath: shape.followPath !== false,
    flipAlternateVertical: shape.flipAlternateVertical ?? true,
    flipAlternateHorizontal: shape.flipAlternateHorizontal ?? true,
    fontSize: geometry.fontSizeMin ?? geometry.fontSizeMax ?? 48,
    repeats: geometry.repeatsMin ?? geometry.repeatsMax ?? 8,
    padding: geometry.paddingMin ?? geometry.paddingMax ?? 0,
    waveCycles: geometry.waveCyclesMin ?? geometry.waveCyclesMax ?? 4,
    waveAmplitude: geometry.waveAmplitudeMin ?? geometry.waveAmplitudeMax ?? 0.22,
    gridColumns: geometry.gridColumnsMin ?? geometry.gridColumnsMax ?? 4,
    lineAngle: geometry.lineAngleMin ?? geometry.lineAngleMax ?? 0,
    emptySpaceMinPx: placement.emptySpaceMinPx ?? 84,
    emptySpaceMinRatio: placement.emptySpaceMinRatio ?? 0.18,
    regionInsetPx: placement.regionInsetPx ?? 12,
    alignToCardEdge: placement.alignToCardEdge ?? true,
    fallbackBandWidth: placement.fallbackBandWidth ?? 88,
    fallbackSide: placement.fallbackSide ?? 'right',
    edgeOverflowPx: placement.edgeOverflowPx ?? 40,
    heroProbability: heroRoll.probability ?? 0.22,
    heroLength: heroText.lengthMin ?? heroText.lengthMax ?? 1,
    heroGlyphColor: hero.color ?? heroText.glyphColor ?? 'glyph',
    heroSizeRatio: heroLayout.sizeRatio ?? 0.98,
    heroOffsetX: heroLayout.offsetXRatioMin ?? heroLayout.offsetXRatioMax ?? 0,
    heroBlend: heroBlendMode,
    heroOpacity:
      heroOpEntry?.min ?? heroOpEntry?.max ?? hero.opacityMin ?? hero.opacityMax ?? 0.25,
    halftoneEnabled: ht.enabled ?? false,
    halftoneDotPx: ht.dotPx ?? 4,
    halftoneContrast: ht.contrast ?? 1.2,
    halftoneSaturation: ht.saturation ?? 1.25,
    halftoneAngleDeg: ht.angleDeg ?? 0,
    halftonePattern: ht.pattern ?? 'grid',
    halftonePaper: ht.paper ?? 'surface',
    ground: 'mint',
    titleFace: base.fonts?.titleFaces?.[0]?.id ?? 'ultra'
  };
}
