import { renderMiniPosterGrid } from './render-mini-poster.js';

/**
 * @param {{ path: string, title: string, index: number, subtext?: string }[]} items
 */
export function renderLandingGallery(items) {
  return renderMiniPosterGrid(
    items.map(({ path, title, index, subtext }) => ({
      path,
      title,
      index,
      subtext
    }))
  );
}
