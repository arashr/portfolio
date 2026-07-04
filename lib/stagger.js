/** Poster horizontal slot in the case-study column grid (1-based start, 6-col span). */
export const POSTER_GRID_SPAN = 6;
export const POSTER_GRID_MAX_START = 4;

const STEPS_COL = [1, 2, 3, 4];

export function posterStaggerCol(slug, index, previousCol = null) {
  let hash = ((index + 1) * 997) % 2147483647;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % 2147483647;
  }
  let slot = hash % STEPS_COL.length;
  let col = STEPS_COL[slot];
  if (previousCol !== null && col === previousCol) {
    slot = (slot + 1) % STEPS_COL.length;
    col = STEPS_COL[slot];
  }
  return col;
}
