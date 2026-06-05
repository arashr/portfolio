const STEPS_REM = [0, 1, 2, 2.75, 3.75, 5, 6.25, 7.5, 9, 10.25, 11.5, 13];

export function posterStaggerRem(slug, index, previousRem = null) {
  let hash = ((index + 1) * 997) % 2147483647;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % 2147483647;
  }
  let slot = hash % STEPS_REM.length;
  let rem = STEPS_REM[slot];
  if (previousRem !== null && rem === previousRem) {
    slot = (slot + 1) % STEPS_REM.length;
    rem = STEPS_REM[slot];
  }
  return rem;
}
